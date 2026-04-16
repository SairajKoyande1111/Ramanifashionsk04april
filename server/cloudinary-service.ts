import path from "path";
import fs from "fs";
import { randomBytes } from "crypto";
import sharp from "sharp";

const IMAGES_DIR = path.join(process.cwd(), "public", "images");

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

function getLocalPath(filename: string): string {
  return path.join(IMAGES_DIR, filename);
}

function urlToFilePath(url: string): string | null {
  if (!url) return null;
  const prefix = "/images/";
  const idx = url.indexOf(prefix);
  if (idx === -1) return null;
  const filename = url.slice(idx + prefix.length);
  return path.join(IMAGES_DIR, filename);
}

export function deleteLocalImage(url: string): void {
  if (!url) return;
  const filePath = urlToFilePath(url);
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`[LocalStorage] Deleted old image: ${filePath}`);
    } catch (err) {
      console.error(`[LocalStorage] Failed to delete old image: ${filePath}`, err);
    }
  }
}

export function deleteLocalImages(urls: (string | undefined | null)[]): void {
  for (const url of urls) {
    if (url) deleteLocalImage(url);
  }
}

export function extractProductImageUrls(product: any): string[] {
  const urls: string[] = [];
  if (Array.isArray(product.images)) {
    for (const img of product.images) {
      if (typeof img === "string" && img.startsWith("/images/")) urls.push(img);
    }
  }
  if (Array.isArray(product.colorVariants)) {
    for (const variant of product.colorVariants) {
      if (Array.isArray(variant.images)) {
        for (const img of variant.images) {
          if (typeof img === "string" && img.startsWith("/images/")) urls.push(img);
        }
      }
    }
  }
  return urls;
}

export function extractCategoryImageUrls(category: any): string[] {
  const urls: string[] = [];
  if (typeof category.image === "string" && category.image.startsWith("/images/")) {
    urls.push(category.image);
  }
  if (Array.isArray(category.subCategories)) {
    for (const sub of category.subCategories) {
      if (typeof sub.image === "string" && sub.image.startsWith("/images/")) {
        urls.push(sub.image);
      }
    }
  }
  return urls;
}

async function compressImage(buffer: Buffer, originalName: string): Promise<{ buffer: Buffer; ext: string }> {
  const TARGET_MIN = 600 * 1024;  // 600 KB
  const TARGET_MAX = 1024 * 1024; // 1 MB

  const originalSizeKB = (buffer.length / 1024).toFixed(1);

  // If already within target range, skip compression
  if (buffer.length >= TARGET_MIN && buffer.length <= TARGET_MAX) {
    const ext = path.extname(originalName).toLowerCase() || ".jpg";
    console.log(`[Compress] ${originalName} — already in range at ${originalSizeKB} KB, skipping compression`);
    return { buffer, ext };
  }

  // If smaller than 600 KB, keep as-is (no upscaling)
  if (buffer.length < TARGET_MIN) {
    const ext = path.extname(originalName).toLowerCase() || ".jpg";
    console.log(`[Compress] ${originalName} — ${originalSizeKB} KB (under 600 KB, keeping as-is)`);
    return { buffer, ext };
  }

  // Image is over 1 MB — compress it
  // We always output as JPEG for maximum compatibility and compression
  const ext = ".jpg";

  // Try quality levels from 85 down to 60 until we hit target
  const qualityLevels = [85, 80, 75, 70, 65, 60];

  for (const quality of qualityLevels) {
    const compressed = await sharp(buffer)
      .rotate() // auto-correct EXIF orientation
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    const compressedSizeKB = (compressed.length / 1024).toFixed(1);
    console.log(`[Compress] ${originalName} — ${originalSizeKB} KB → quality ${quality} → ${compressedSizeKB} KB`);

    if (compressed.length <= TARGET_MAX) {
      console.log(`[Compress] ✓ Final size ${compressedSizeKB} KB at quality ${quality}`);
      return { buffer: compressed, ext };
    }
  }

  // If still over 1 MB after quality reduction, try resizing down while maintaining aspect ratio
  const metadata = await sharp(buffer).metadata();
  const widthSteps = [1600, 1400, 1200, 1000, 800];

  for (const maxWidth of widthSteps) {
    if (metadata.width && metadata.width <= maxWidth) continue;

    const resized = await sharp(buffer)
      .rotate()
      .resize({ width: maxWidth, withoutEnlargement: true })
      .jpeg({ quality: 75, mozjpeg: true })
      .toBuffer();

    const resizedSizeKB = (resized.length / 1024).toFixed(1);
    console.log(`[Compress] ${originalName} — resized to ${maxWidth}px → ${resizedSizeKB} KB`);

    if (resized.length <= TARGET_MAX) {
      console.log(`[Compress] ✓ Final size ${resizedSizeKB} KB after resize to ${maxWidth}px`);
      return { buffer: resized, ext };
    }
  }

  // Last resort: resize to 800px with quality 60
  const fallback = await sharp(buffer)
    .rotate()
    .resize({ width: 800, withoutEnlargement: true })
    .jpeg({ quality: 60, mozjpeg: true })
    .toBuffer();

  const fallbackSizeKB = (fallback.length / 1024).toFixed(1);
  console.log(`[Compress] ${originalName} — fallback result: ${fallbackSizeKB} KB`);
  return { buffer: fallback, ext };
}

export async function uploadToCloudinary(
  buffer: Buffer,
  originalName: string,
  oldUrl?: string,
): Promise<string> {
  if (oldUrl) {
    deleteLocalImage(oldUrl);
  }

  const { buffer: compressedBuffer, ext } = await compressImage(buffer, originalName);

  const filename = randomBytes(16).toString("hex") + ext;
  const destPath = getLocalPath(filename);

  fs.writeFileSync(destPath, compressedBuffer);

  const sizeMB = (compressedBuffer.length / 1024 / 1024).toFixed(2);
  const sizeKB = (compressedBuffer.length / 1024).toFixed(0);
  console.log(`[LocalStorage] Saved: ${filename} — ${sizeKB} KB (${sizeMB} MB)`);

  return `/images/${filename}`;
}

export default {};
