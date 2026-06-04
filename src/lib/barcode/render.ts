import * as bwipjs from 'bwip-js/browser';
import type { BarcodeFormat } from '../types';

const BCID: Record<BarcodeFormat, string> = {
  ean13: 'ean13', ean8: 'ean8', upca: 'upca', upce: 'upce',
  code128: 'code128', code39: 'code39', itf: 'interleaved2of5',
  codabar: 'rationalizedCodabar', qr: 'qrcode', aztec: 'azteccode',
  pdf417: 'pdf417', datamatrix: 'datamatrix',
};

export function toBwipId(format: BarcodeFormat): string { return BCID[format]; }

export function renderToCanvas(
  canvas: HTMLCanvasElement, format: BarcodeFormat, value: string,
) {
  bwipjs.toCanvas(canvas, {
    bcid: toBwipId(format),
    text: value,
    scale: 3,
    height: format === 'qr' || format === 'aztec' || format === 'datamatrix' ? undefined : 14,
    includetext: false,
    backgroundcolor: 'FFFFFF',
    paddingwidth: 10,
    paddingheight: 10,
  });
}
