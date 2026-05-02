import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";
import { Product, Category } from "./models";
import path from "path";
import fs from "fs";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  limit: "100mb",
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: "100mb" }));

// Add Content Security Policy headers for PhonePe payment integration
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com https://dgq88cldibal5.cloudfront.net https://mercurystatic.phonepe.com https://linchpin.phonepe.com https://mercury.phonepe.com https://www.phonepe.com https://mercury-t2.phonepe.com https://connect.facebook.net blob: data:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "media-src 'self' data: blob:",
      "connect-src 'self' https://api.phonepe.com https://mercury.phonepe.com https://mercury-t2.phonepe.com https://fonts.googleapis.com wss: https:",
      "worker-src 'self' blob: data: https://mercury-t2.phonepe.com",
      "frame-src https://api.phonepe.com https://mercury.phonepe.com https://mercury-t2.phonepe.com https://www.youtube.com https://maps.google.com https://www.google.com/maps"
    ].join('; ')
  );
  next();
});

// Serve static files from attached_assets directory
app.use("/attached_assets", express.static(path.resolve("./attached_assets")));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.resolve("./uploads")));

// Serve static files from images directory (local image storage, replaces Cloudinary)
app.use("/images", express.static(path.resolve("./public/images")));

// Serve static files from media directory with proper video streaming headers
const mimeTypes: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogv": "video/ogg",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
};

// Setup media serving - ALWAYS register, even if directory is missing
const primaryPath = path.resolve("./public/media");
const secondaryPath = path.resolve("./dist/public/media");

// Check which paths exist (for logging purposes)
const primaryExists = fs.existsSync(primaryPath);
const secondaryExists = fs.existsSync(secondaryPath);

console.log(`[Media] Primary path (./public/media): ${primaryExists ? 'EXISTS' : 'MISSING'}`);
if (process.env.NODE_ENV === "production") {
  console.log(`[Media] Secondary path (./dist/public/media): ${secondaryExists ? 'EXISTS' : 'MISSING'}`);
}

// Always serve from primary path with proper headers
// The directory might not exist yet but that's OK - static middleware handles that
app.use("/media", express.static(primaryPath, {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext];
    if (ext === ".mp4") {
      console.log(`[Media] Serving: ${filePath}`);
    }
    if (mimeType) {
      res.setHeader("Content-Type", mimeType);
    }
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "no-cache, must-revalidate");
  },
}));

// In production, also serve from dist/public as fallback
if (process.env.NODE_ENV === "production") {
  app.use("/media", express.static(secondaryPath, {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = mimeTypes[ext];
      if (ext === ".mp4") {
        console.log(`[Media] Serving from dist: ${filePath}`);
      }
      if (mimeType) {
        res.setHeader("Content-Type", mimeType);
      }
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Cache-Control", "public, max-age=3600");
    },
  }));
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Seed database with sample products
  await seedDatabase();

  // Clean up stale subcategory references on products
  try {
    const allCategories = await Category.find({});
    const validSubNames = new Set<string>();
    for (const cat of allCategories) {
      const subs: any[] = Array.isArray(cat.subCategories) ? cat.subCategories : [];
      for (const sub of subs) {
        if (sub.name) validSubNames.add(sub.name);
      }
    }
    const result = await Product.updateMany(
      { subcategory: { $exists: true, $ne: "" }, $expr: { $not: { $in: ["$subcategory", Array.from(validSubNames)] } } },
      { $unset: { subcategory: "" } }
    );
    if (result.modifiedCount > 0) {
      log(`Cleaned ${result.modifiedCount} products with stale subcategory references`);
    }
  } catch (e: any) {
    log(`Subcategory cleanup warning: ${e.message}`);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
