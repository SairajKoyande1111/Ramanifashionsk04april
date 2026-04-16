import path from "path";
import fs from "fs";
import { randomBytes } from "crypto";

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

export async function uploadToCloudinary(
  buffer: Buffer,
  originalName: string,
  oldUrl?: string,
): Promise<string> {
  if (oldUrl) {
    deleteLocalImage(oldUrl);
  }

  const ext = path.extname(originalName).toLowerCase() || ".jpg";
  const filename = randomBytes(16).toString("hex") + ext;
  const destPath = getLocalPath(filename);

  fs.writeFileSync(destPath, buffer);

  const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
  console.log(`[LocalStorage] Saved: ${filename} — ${sizeMB} MB — full quality, no compression`);

  return `/images/${filename}`;
}

export default {};
