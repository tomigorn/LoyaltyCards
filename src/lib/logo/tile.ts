export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  return words.slice(0, 2).map(w => w[0]!.toUpperCase()).join('');
}

/** Render a colored tile with initials → PNG data URL. */
export function generateTile(name: string, brandColor: string, size = 256): string {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = brandColor || '#444';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.42}px system-ui, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(initials(name), size / 2, size / 2 + size * 0.02);
  return canvas.toDataURL('image/png');
}
