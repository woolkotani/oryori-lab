import { upload } from "@vercel/blob/client";

/**
 * Upload an image and return its public URL.
 * - In production (NEXT_PUBLIC_BLOB_UPLOAD=1): browser uploads directly to Vercel Blob
 *   via a signed token from /api/upload. Bypasses the 4.5MB serverless body limit.
 * - In local dev: posts FormData to /api/upload, which writes to public/uploads/.
 */
export async function uploadPhoto(file: File): Promise<string> {
  if (process.env.NEXT_PUBLIC_BLOB_UPLOAD === "1") {
    const blob = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/api/upload",
    });
    return blob.url;
  }

  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("upload failed");
  const data = (await res.json()) as { url: string };
  return data.url;
}
