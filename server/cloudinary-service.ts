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
