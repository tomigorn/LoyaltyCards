export type BarcodeFormat =
  | 'ean13' | 'ean8' | 'upca' | 'upce'
  | 'code128' | 'code39' | 'itf' | 'codabar'
  | 'qr' | 'aztec' | 'pdf417' | 'datamatrix';

export type LogoSource = 'catalog' | 'fetched' | 'uploaded' | 'generated';
export interface Logo { source: LogoSource; blobRef?: string; }

export interface Card {
  id: string;
  storeName: string;
  barcodeValue: string;
  barcodeFormat: BarcodeFormat;
  brandColor: string;       // hex like "#FF6600"
  logo: Logo;
  notes: string;
  frontPhotoRef?: string;   // key in images store
  backPhotoRef?: string;
  favorite: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface CatalogEntry {
  id: string;
  name: string;
  aliases: string[];
  brandColor: string;
  logoAsset: string;        // path under /catalog-logos/
  defaultFormat?: BarcodeFormat;
}
