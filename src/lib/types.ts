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
  catalogId?: string;        // links a card to a CatalogEntry.id
}

export interface CatalogEntry {
  id: string;                // e.g. 'ch-migros'
  name: string;
  aliases: string[];
  domain: string;            // logo.dev key, e.g. 'migros.ch'
  country: string;           // ISO-2: CH, DE, FR, IT, AT, US, CA
  defaultFormat?: BarcodeFormat;
  brandColor?: string;
}
