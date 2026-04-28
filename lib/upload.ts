import { upload } from "@vercel/blob/client";

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("image decode failed"));
      img.src = url;
    });
    return img;
  } finally {
    // Revoked after the image is drawn — defer
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/**
 * Resize an image file so the longest side <= MAX_DIMENSION, re-encode as JPEG.
 * Returns the original file unchanged if it's small AND already JPEG/PNG.
 */
async function resizeImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    // HEIC etc. that the browser can't decode — let server/Blob handle it as-is
    return file;
  }

  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  if (longest <= MAX_DIMENSION && (file.type === "image/jpeg" || file.type === "image/png")) {
    return file;
  }

  const scale = Math.min(1, MAX_DIMENSION / longest);
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, w, h);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}

/**
 * Upload an image and return its public URL. Resizes large images client-side first.
 * - Production (NEXT_PUBLIC_BLOB_UPLOAD=1): browser → Vercel Blob direct upload.
 * - Local dev: posts FormData to /api/upload (writes to public/uploads/).
 */
export async function uploadPhoto(file: File): Promise<string> {
  const prepared = await resizeImage(file);

  if (process.env.NEXT_PUBLIC_BLOB_UPLOAD === "1") {
    const blob = await upload(prepared.name, prepared, {
      access: "public",
      handleUploadUrl: "/api/upload",
    });
    return blob.url;
  }

  const fd = new FormData();
  fd.append("file", prepared);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("upload failed");
  const data = (await res.json()) as { url: string };
  return data.url;
}
