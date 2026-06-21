import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION ?? "auto";

export const PUBLIC_BUCKET = process.env.S3_BUCKET_PUBLIC ?? "atria-public";
export const PRIVATE_BUCKET = process.env.S3_BUCKET_PRIVATE ?? "atria-private";

let _s3: S3Client | null = null;

function s3(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({
      region,
      endpoint,
      forcePathStyle: !!endpoint, // required for R2/MinIO-style endpoints
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return _s3;
}

/** Presigned URL the browser uses to PUT a file directly to storage. */
export function presignUpload(bucket: string, key: string, contentType: string, expiresIn = 600) {
  return getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn },
  );
}

/** Short-lived presigned URL to read a private object (e.g. legal documents). */
export function presignDownload(bucket: string, key: string, expiresIn = 300) {
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
}

/** Public URL for objects in the public bucket. */
export function publicUrl(key: string): string {
  const base = process.env.S3_PUBLIC_URL ?? `${endpoint}/${PUBLIC_BUCKET}`;
  return `${base}/${key}`;
}

export function makeObjectKey(prefix: string, fileName: string, id: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${prefix}/${id}/${safe}`;
}
