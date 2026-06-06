import type { BarcodeFormat } from '../types';

const FROM_DETECTOR: Record<string, BarcodeFormat> = {
  ean_13: 'ean13', ean_8: 'ean8', upc_a: 'upca', upc_e: 'upce',
  code_128: 'code128', code_39: 'code39', itf: 'itf', codabar: 'codabar',
  qr_code: 'qr', aztec: 'aztec', pdf417: 'pdf417', data_matrix: 'datamatrix',
};

export function mapDetectedFormat(s: string): BarcodeFormat | undefined {
  return FROM_DETECTOR[s];
}

export interface ScanResult { value: string; format: BarcodeFormat; }

/** Decode a single barcode/QR from a STILL image (a picked photo or screenshot of a digital
 *  card). Returns null if no code is found. Native BarcodeDetector first, then @zxing/browser. */
export async function detectFromImage(file: Blob): Promise<ScanResult | null> {
  // @ts-expect-error BarcodeDetector is not in the TS DOM lib yet
  if (typeof window.BarcodeDetector !== 'undefined') {
    try {
      // @ts-expect-error runtime API
      const detector = new window.BarcodeDetector();
      const bitmap = await createImageBitmap(file);
      const codes = await detector.detect(bitmap);
      bitmap.close?.();
      if (codes.length) {
        const f = mapDetectedFormat(codes[0].format);
        if (f) return { value: codes[0].rawValue, format: f };
      }
    } catch { /* fall through to zxing */ }
  }
  try {
    const { BrowserMultiFormatReader } = await import('@zxing/browser');
    const { BarcodeFormat: ZxingFormat } = await import('@zxing/library');
    const reader = new BrowserMultiFormatReader();
    const url = URL.createObjectURL(file);
    try {
      const res = await reader.decodeFromImageUrl(url);
      const keyName = ZxingFormat[res.getBarcodeFormat()]?.toLowerCase() as string | undefined;
      const fmt = keyName ? mapDetectedFormat(keyName) : undefined;
      if (fmt) return { value: res.getText(), format: fmt };
    } finally { URL.revokeObjectURL(url); }
  } catch { /* no code found in the image */ }
  return null;
}

/** Start scanning from a <video> element. Returns a stop() function.
 *  Uses native BarcodeDetector when available, else @zxing/browser. */
export async function startScan(
  video: HTMLVideoElement, onResult: (r: ScanResult) => void,
): Promise<() => void> {
  // @ts-expect-error BarcodeDetector is not in TS DOM lib yet
  if (typeof window.BarcodeDetector !== 'undefined') {
    // @ts-expect-error runtime API
    const detector = new window.BarcodeDetector();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });
    video.srcObject = stream; await video.play();
    let active = true;
    const loop = async () => {
      if (!active) return;
      try {
        const codes = await detector.detect(video);
        if (codes.length) {
          const f = mapDetectedFormat(codes[0].format);
          if (f) { onResult({ value: codes[0].rawValue, format: f }); }
        }
      } catch { /* frame skip */ }
      if (active) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => { active = false; stream.getTracks().forEach((t: MediaStreamTrack) => t.stop()); };
  }
  const { BrowserMultiFormatReader } = await import('@zxing/browser');
  const { BarcodeFormat: ZxingFormat } = await import('@zxing/library');
  const reader = new BrowserMultiFormatReader();
  const controls = await reader.decodeFromVideoDevice(undefined, video, (res, _err, _ctrl) => {
    if (res) {
      const fmtNum = res.getBarcodeFormat();
      // Map zxing enum key name to our detector-style string, then to BarcodeFormat
      const keyName = ZxingFormat[fmtNum]?.toLowerCase() as string | undefined;
      const fmt = keyName !== undefined ? mapDetectedFormat(keyName) : undefined;
      if (fmt === undefined) return;
      onResult({ value: res.getText(), format: fmt });
    }
  });
  return () => controls.stop();
}
