const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const TYPE_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface UploadResult {
  key: string;
  size: number;
  contentType: string;
}

export async function uploadFile(
  bucket: R2Bucket,
  file: File,
  folder: string,
): Promise<UploadResult> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(`File type "${file.type}" is not allowed. Accepted: PDF, JPEG, PNG, WebP.`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds the 10MB limit.`);
  }

  const ext = TYPE_TO_EXT[file.type] ?? 'bin';
  const key = `${folder}/${crypto.randomUUID()}.${ext}`;

  await bucket.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { originalName: file.name },
  });

  return { key, size: file.size, contentType: file.type };
}

export async function deleteFile(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key);
}
