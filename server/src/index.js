import "dotenv/config";
import crypto from "node:crypto";
import path from "node:path";
import express from "express";
import cors from "cors";
import multer from "multer";
import mongoose from "mongoose";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Upload from "./models/Upload.js";

const requiredEnv = [
  "MONGODB_URI",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "ADMIN_TOKEN",
];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
}

const app = express();
const port = Number(process.env.PORT || 4000);
const maxFileSize = Number(process.env.MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024);
const allowedOrigins = (
  process.env.CLIENT_ORIGIN ||
  "https://developerruhban.online"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSize, files: 1 },
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS origin not allowed: ${origin}`));
    },
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

const requireAdmin = (request, response, next) => {
  const authorization = request.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!token || token !== process.env.ADMIN_TOKEN) {
    return response.status(401).json({ message: "Admin authentication required." });
  }

  return next();
};

app.get("/api/admin/uploads", requireAdmin, async (request, response, next) => {
  try {
    const limit = Math.min(Math.max(Number(request.query.limit) || 50, 1), 100);
    const uploads = await Upload.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const items = await Promise.all(
      uploads.map(async (item) => {
        if (!item.file?.key || item.file.url) return item;

        const url = await getSignedUrl(
          s3,
          new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: item.file.key,
          }),
          { expiresIn: 900 },
        );

        return { ...item, file: { ...item.file, url } };
      }),
    );

    return response.json({ uploads: items });
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/admin/uploads/:id", requireAdmin, async (request, response, next) => {
  try {
    const uploadRecord = await Upload.findById(request.params.id);
    if (!uploadRecord) {
      return response.status(404).json({ message: "Upload not found." });
    }

    if (uploadRecord.file?.key) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: uploadRecord.file.key,
        }),
      );
    }

    await uploadRecord.deleteOne();
    return response.json({ message: "Upload deleted." });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/uploads", upload.single("file"), async (request, response, next) => {
  try {
    const text = typeof request.body.text === "string" ? request.body.text.trim() : "";
    if (!text && !request.file) {
      return response.status(400).json({ message: "Provide text, a file, or both." });
    }
    if (text.length > 10000) {
      return response.status(400).json({ message: "Text must be 10,000 characters or fewer." });
    }

    const record = { text: text || undefined };
    if (request.file) {
      const extension = path.extname(request.file.originalname);
      const key = `uploads/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}${extension}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
          Body: request.file.buffer,
          ContentType: request.file.mimetype || "application/octet-stream",
        }),
      );
      record.file = {
        key,
        name: request.file.originalname,
        contentType: request.file.mimetype,
        size: request.file.size,
        url: process.env.R2_PUBLIC_BASE_URL
          ? `${process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`
          : undefined,
      };
    }

    const savedUpload = await Upload.create(record);
    return response.status(201).json({
      id: savedUpload.id,
      createdAt: savedUpload.createdAt,
      text: savedUpload.text || null,
      file: savedUpload.file || null,
    });
  } catch (error) {
    return next(error);
  }
});

app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return response.status(413).json({ message: "File exceeds the configured size limit." });
  }
  console.error(error);
  return response.status(500).json({ message: "The upload could not be completed." });
});

const connectToMongoDb = async () => {
  const attempts = 5;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
      });
      return;
    } catch (error) {
      if (attempt === attempts) {
        if (error.code === "ECONNREFUSED" && error.syscall === "querySrv") {
          throw new Error(
            "MongoDB Atlas SRV DNS lookup was refused. Check your network DNS settings or use a non-SRV MongoDB connection string from Atlas.",
            { cause: error },
          );
        }
        throw error;
      }

      const delay = attempt * 2000;
      console.warn(
        `MongoDB connection attempt ${attempt}/${attempts} failed. Retrying in ${delay / 1000}s...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

try {
  await connectToMongoDb();
  app.listen(port, () => {
    console.log(`Upload API listening on port ${port}`);
  });
} catch (error) {
  console.error("Upload API could not start:", error.message);
  if (error.cause) {
    console.error("MongoDB connection detail:", error.cause.message);
  }
  process.exitCode = 1;
}
