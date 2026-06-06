import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';

// vi.mock is hoisted — use vi.hoisted to initialise mocks before factory runs.
const { mockGetURL, mockGetToken } = vi.hoisted(() => ({
  mockGetURL: vi.fn((record: any, file: string, opts?: any) =>
    `https://fake.pb/${record.id}/${file}?token=${opts?.token}`),
  mockGetToken: vi.fn(async () => 'test-token-abc'),
}));

vi.mock('../auth/client', () => ({
  pb: {
    files: {
      getURL: mockGetURL,
      getToken: mockGetToken,
    },
  },
}));

// Mock global fetch — returns ok with a small blob.
const mockFetch = vi.fn(async (_url: string) => ({
  ok: true,
  blob: async () => new Blob(['imagedata'], { type: 'image/jpeg' }),
}));
vi.stubGlobal('fetch', mockFetch);

import { getImage, putImage } from '../db';
import { buildImageUploads, pullImages } from './images';
import type { Card } from '../types';

const baseCard = (): Card => ({
  id: 'card1',
  storeName: 'Test',
  barcodeValue: '1234',
  barcodeFormat: 'code128',
  brandColor: '#000',
  logo: { source: 'generated' },
  notes: '',
  favorite: false,
  order: 0,
  createdAt: 1,
  updatedAt: 2,
});

beforeEach(() => {
  mockFetch.mockClear();
  mockGetURL.mockClear();
  mockGetToken.mockClear();
});

describe('buildImageUploads', () => {
  it('includes frontPhoto when remote lacks a file for that ref', async () => {
    const ref = 'ref-front-001';
    const blob = new Blob(['frontdata'], { type: 'image/jpeg' });
    await putImage(ref, blob);

    const card: Card = { ...baseCard(), frontPhotoRef: ref };
    const remote = { frontPhotoRef: '', frontPhoto: '' }; // no file on remote

    const payload = await buildImageUploads(card, remote);

    expect(payload).toHaveProperty('frontPhoto');
    expect(payload.frontPhoto).toBeInstanceOf(File);
    expect(payload.frontPhoto.name).toBe('frontPhoto.jpg');
  });

  it('skips frontPhoto when remote already has the file for the same ref', async () => {
    const ref = 'ref-front-002';
    const blob = new Blob(['frontdata2'], { type: 'image/jpeg' });
    await putImage(ref, blob);

    const card: Card = { ...baseCard(), frontPhotoRef: ref };
    // remote already has the file for this exact ref
    const remote = { frontPhotoRef: ref, frontPhoto: 'frontPhoto_abc123.jpg' };

    const payload = await buildImageUploads(card, remote);

    expect(payload).not.toHaveProperty('frontPhoto');
  });

  it('skips when card has no ref', async () => {
    const card: Card = { ...baseCard() }; // no frontPhotoRef
    const payload = await buildImageUploads(card, null);
    expect(Object.keys(payload)).toHaveLength(0);
  });

  it('skips when blob is missing from local db', async () => {
    const card: Card = { ...baseCard(), frontPhotoRef: 'ref-missing-xyz' };
    const payload = await buildImageUploads(card, null);
    expect(payload).not.toHaveProperty('frontPhoto');
  });

  it('includes backPhoto and logoImage when refs differ from remote', async () => {
    const backRef = 'ref-back-003';
    const logoRef = 'ref-logo-003';
    await putImage(backRef, new Blob(['back'], { type: 'image/jpeg' }));
    await putImage(logoRef, new Blob(['logo'], { type: 'image/jpeg' }));

    const card: Card = {
      ...baseCard(),
      backPhotoRef: backRef,
      logo: { source: 'uploaded', blobRef: logoRef },
    };
    const remote = { backPhotoRef: 'old-ref', backPhoto: 'old.jpg', logoBlobRef: '', logoImage: '' };

    const payload = await buildImageUploads(card, remote);

    expect(payload).toHaveProperty('backPhoto');
    expect(payload).toHaveProperty('logoImage');
  });

  it('includes all three slots when remote is null (new card)', async () => {
    const frontRef = 'ref-f-004';
    const backRef = 'ref-b-004';
    const logoRef = 'ref-l-004';
    await putImage(frontRef, new Blob(['f'], { type: 'image/jpeg' }));
    await putImage(backRef, new Blob(['b'], { type: 'image/jpeg' }));
    await putImage(logoRef, new Blob(['l'], { type: 'image/jpeg' }));

    const card: Card = {
      ...baseCard(),
      frontPhotoRef: frontRef,
      backPhotoRef: backRef,
      logo: { source: 'uploaded', blobRef: logoRef },
    };

    const payload = await buildImageUploads(card, null);
    expect(payload).toHaveProperty('frontPhoto');
    expect(payload).toHaveProperty('backPhoto');
    expect(payload).toHaveProperty('logoImage');
  });
});

describe('pullImages', () => {
  it('downloads and stores a blob when the local ref is missing', async () => {
    const ref = 'ref-pull-001';
    const remote = {
      id: 'remote1',
      frontPhotoRef: ref,
      frontPhoto: 'frontPhoto_server.jpg',
      backPhotoRef: '',
      backPhoto: '',
      logoBlobRef: '',
      logoImage: '',
    };

    // Ensure blob is not in local DB
    expect(await getImage(ref)).toBeUndefined();

    await pullImages(remote, 'test-token-abc');

    expect(mockFetch).toHaveBeenCalledOnce();
    const stored = await getImage(ref);
    expect(stored).toBeDefined();
  });

  it('skips download when local already has the blob', async () => {
    const ref = 'ref-pull-002';
    await putImage(ref, new Blob(['existing'], { type: 'image/jpeg' }));

    const remote = {
      id: 'remote2',
      frontPhotoRef: ref,
      frontPhoto: 'frontPhoto_server.jpg',
      backPhotoRef: '',
      backPhoto: '',
      logoBlobRef: '',
      logoImage: '',
    };

    mockFetch.mockClear();
    await pullImages(remote, 'test-token-abc');

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('skips slot when ref or file is empty', async () => {
    const remote = {
      id: 'remote3',
      frontPhotoRef: '',
      frontPhoto: '',
      backPhotoRef: '',
      backPhoto: '',
      logoBlobRef: '',
      logoImage: '',
    };

    await pullImages(remote, 'test-token-abc');

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('downloads all three slots when all refs are missing locally', async () => {
    const fRef = 'ref-pull-f-003';
    const bRef = 'ref-pull-b-003';
    const lRef = 'ref-pull-l-003';

    const remote = {
      id: 'remote4',
      frontPhotoRef: fRef,
      frontPhoto: 'front.jpg',
      backPhotoRef: bRef,
      backPhoto: 'back.jpg',
      logoBlobRef: lRef,
      logoImage: 'logo.jpg',
    };

    await pullImages(remote, 'my-token');

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(await getImage(fRef)).toBeDefined();
    expect(await getImage(bRef)).toBeDefined();
    expect(await getImage(lRef)).toBeDefined();
  });

  it('calls pb.files.getURL with correct args', async () => {
    const ref = 'ref-url-005';
    const remote = {
      id: 'remoteX',
      frontPhotoRef: ref,
      frontPhoto: 'front_abc.jpg',
      backPhotoRef: '',
      backPhoto: '',
      logoBlobRef: '',
      logoImage: '',
    };

    await pullImages(remote, 'tok123');

    expect(mockGetURL).toHaveBeenCalledWith(remote, 'front_abc.jpg', { token: 'tok123' });
  });
});
