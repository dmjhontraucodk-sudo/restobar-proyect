function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  const mimes: Record<string, string> = {
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
    png:  'image/png',
    gif:  'image/gif',
    webp: 'image/webp',
    svg:  'image/svg+xml',
    bmp:  'image/bmp',
  };
  return mimes[ext] ?? 'image/jpeg';
}

export const uploadService = {
  async uploadImage(fileBuffer: Buffer, fileName: string): Promise<string> {
    const mime = getMimeType(fileName);
    const base64 = fileBuffer.toString('base64');
    return `data:${mime};base64,${base64}`;
  },
};
