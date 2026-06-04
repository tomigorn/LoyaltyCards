import type { BarcodeFormat } from '../types';

export const FORMATS: BarcodeFormat[] = [
  'ean13', 'ean8', 'upca', 'upce', 'code128', 'code39',
  'itf', 'codabar', 'qr', 'aztec', 'pdf417', 'datamatrix',
];

export const FORMAT_LABELS: Record<BarcodeFormat, string> = {
  ean13: 'EAN-13', ean8: 'EAN-8', upca: 'UPC-A', upce: 'UPC-E',
  code128: 'Code 128', code39: 'Code 39', itf: 'ITF', codabar: 'Codabar',
  qr: 'QR', aztec: 'Aztec', pdf417: 'PDF417', datamatrix: 'Data Matrix',
};

export interface Validation { ok: boolean; error?: string; }

function eanChecksumOk(digits: string): boolean {
  const n = digits.split('').map(Number);
  const check = n.pop()!;
  const sum = n.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

export function validateBarcode(format: BarcodeFormat, value: string): Validation {
  if (!value) return { ok: false, error: 'Value is empty' };
  const digits = /^\d+$/.test(value);
  switch (format) {
    case 'ean13':
      if (value.length !== 13 || !digits) return { ok: false, error: 'EAN-13 needs 13 digits' };
      return eanChecksumOk(value) ? { ok: true } : { ok: false, error: 'Bad checksum' };
    case 'ean8':
      if (value.length !== 8 || !digits) return { ok: false, error: 'EAN-8 needs 8 digits' };
      return eanChecksumOk(value) ? { ok: true } : { ok: false, error: 'Bad checksum' };
    case 'upca':
      if (value.length !== 12 || !digits) return { ok: false, error: 'UPC-A needs 12 digits' };
      return eanChecksumOk('0' + value) ? { ok: true } : { ok: false, error: 'Bad checksum' };
    case 'upce':
      return value.length >= 6 && value.length <= 8 && digits
        ? { ok: true } : { ok: false, error: 'UPC-E needs 6–8 digits' };
    case 'itf':
      return digits && value.length % 2 === 0
        ? { ok: true } : { ok: false, error: 'ITF needs an even number of digits' };
    default:
      return { ok: true };
  }
}
