import "dotenv/config";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
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
import Contact from "./models/Contact.js";
import Visitor from "./models/Visitor.js";
import Visit from "./models/Visit.js";
import musicRoutes, { createStreamHandler, createCoverHandler } from "./routes/music.js";
import { createAdminMusicRouter } from "./routes/adminMusic.js";
import {
  getClientIp,
  anonymizeIp,
  lookupIpLocation,
  parseUserAgent,
} from "./services/geolocation.js";

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
      if (
        !origin ||
        origin === "null" ||
        allowedOrigins.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        /^https:\/\/([a-zA-Z0-9-]+\.)?developerruhban\.online$/.test(origin) ||
        /^https:\/\/([a-zA-Z0-9-]+\.)?vercel\.app$/.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "ruhban-portfolio-api",
    timestamp: new Date().toISOString(),
  });
});

const requireAdmin = (request, response, next) => {
  const authorization = request.get("authorization") || "";
  const xAdminToken = request.get("x-admin-token") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : (xAdminToken || authorization);

  if (!token || token !== process.env.ADMIN_TOKEN) {
    return response.status(401).json({ message: "Admin authentication required." });
  }

  return next();
};

// ============================================================================
// 1. VISITOR TRACKING & PUBLIC COUNTER ENDPOINTS
// ============================================================================

/**
 * Public Counter: Returns total unique visitors and total visits
 * Never fabricates numbers. If DB is unavailable, returns error status.
 */
app.get("/api/tracking/visitor-count", async (_request, response, next) => {
  try {
    const [uniqueCount, totalVisits] = await Promise.all([
      Visitor.countDocuments(),
      Visit.countDocuments(),
    ]);

    return response.json({
      count: uniqueCount,
      totalVisits,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * Record a Visit
 * - Pseudonymous visitorId generated client-side and saved in browser storage/cookie
 * - Deduplicates rapid duplicate requests (e.g. within 15 seconds for same section)
 * - Detects new vs repeat visitors
 * - Performs IP-based location estimation
 */
app.post("/api/tracking/visit", async (request, response, next) => {
  try {
    const {
      visitorId,
      sessionId,
      page = "/",
      section = "home",
      referrer = "",
      device: clientDevice = {},
      isNewSession = false,
    } = request.body || {};

    if (!visitorId || typeof visitorId !== "string") {
      return response.status(400).json({ message: "Valid visitorId is required." });
    }
    if (!sessionId || typeof sessionId !== "string") {
      return response.status(400).json({ message: "Valid sessionId is required." });
    }

    const cleanVisitorId = visitorId.trim().slice(0, 64);
    const cleanSessionId = sessionId.trim().slice(0, 64);
    const cleanPage = String(page).trim().slice(0, 100);
    const cleanSection = String(section).trim().slice(0, 60);
    const cleanReferrer = String(referrer).trim().slice(0, 500);

    // Deduplication check: ignore identical visit ping within last 15 seconds
    const fifteenSecondsAgo = new Date(Date.now() - 15 * 1000);
    const recentDuplicate = await Visit.findOne({
      visitorId: cleanVisitorId,
      sessionId: cleanSessionId,
      section: cleanSection,
      timestamp: { $gte: fifteenSecondsAgo },
    }).lean();

    if (recentDuplicate) {
      const totalUnique = await Visitor.countDocuments();
      return response.json({
        success: true,
        deduplicated: true,
        totalUniqueVisitors: totalUnique,
      });
    }

    // IP and Geolocation resolution
    const clientIp = getClientIp(request);
    const anonymizedIp = anonymizeIp(clientIp);
    const parsedUa = parseUserAgent(request.headers["user-agent"] || "");

    const deviceCategory =
      clientDevice.category || parsedUa.category || "desktop";
    const browser = clientDevice.browser || parsedUa.browser || "Unknown";
    const os = clientDevice.os || parsedUa.os || "Unknown";

    let visitor = await Visitor.findOne({ visitorId: cleanVisitorId });
    let isNewVisitor = false;

    if (!visitor) {
      // First time seeing this pseudonymous identifier
      isNewVisitor = true;
      const geo = await lookupIpLocation(clientIp);

      visitor = await Visitor.create({
        visitorId: cleanVisitorId,
        firstSeen: new Date(),
        lastSeen: new Date(),
        visitCount: 1,
        approxGeo: {
          country: geo.country,
          countryCode: geo.countryCode,
          region: geo.region,
          city: geo.city,
          timezone: geo.timezone,
        },
        locationSource: geo.source,
        lastDevice: {
          category: deviceCategory,
          browser,
          os,
          userAgent: (request.headers["user-agent"] || "").slice(0, 300),
        },
        anonymizedIp,
      });
    } else {
      // Existing visitor: increment visits if new session, update last seen
      visitor.lastSeen = new Date();
      if (isNewSession) {
        visitor.visitCount += 1;
      }
      visitor.lastDevice = {
        category: deviceCategory,
        browser,
        os,
        userAgent: (request.headers["user-agent"] || "").slice(0, 300),
      };
      await visitor.save();
    }

    // Record visit document
    const visitRecord = await Visit.create({
      visitId: crypto.randomUUID(),
      visitorId: cleanVisitorId,
      sessionId: cleanSessionId,
      timestamp: new Date(),
      page: cleanPage,
      section: cleanSection,
      referrer: cleanReferrer,
      device: {
        category: deviceCategory,
        browser,
        os,
      },
      location: {
        country: visitor.approxGeo?.country || "Unknown",
        region: visitor.approxGeo?.region || "",
        city: visitor.approxGeo?.city || "",
        source: visitor.locationSource || "ip_estimated",
      },
    });

    const totalUniqueVisitors = await Visitor.countDocuments();

    return response.status(201).json({
      success: true,
      isNewVisitor,
      visitId: visitRecord.visitId,
      totalUniqueVisitors,
      visitor: {
        visitorId: visitor.visitorId,
        visitCount: visitor.visitCount,
        approxGeo: visitor.approxGeo,
        locationSource: visitor.locationSource,
      },
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * Record Precise Location (Requires explicit visitor consent)
 * Triggers only after visitor explicitly chooses "Allow location access"
 */
app.post("/api/tracking/location", async (request, response, next) => {
  try {
    const { visitorId, latitude, longitude, accuracy, timestamp } =
      request.body || {};

    if (!visitorId || typeof visitorId !== "string") {
      return response.status(400).json({ message: "visitorId is required." });
    }

    const lat = Number(latitude);
    const lon = Number(longitude);
    const acc = Number(accuracy);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return response.status(400).json({ message: "Invalid latitude or longitude." });
    }

    const visitor = await Visitor.findOne({ visitorId: visitorId.trim() });
    if (!visitor) {
      return response.status(404).json({ message: "Visitor record not found." });
    }

    // Store precise coordinates and accuracy radius strictly with user consent
    visitor.preciseLocation = {
      latitude: lat,
      longitude: lon,
      accuracy: !Number.isNaN(acc) ? acc : null,
      collectedAt: timestamp ? new Date(timestamp) : new Date(),
    };
    visitor.locationSource = "precise_gps";
    visitor.consentMetadata = {
      ...visitor.consentMetadata,
      promptShown: true,
      locationConsentGranted: true,
      promptDismissed: true,
      consentedAt: new Date(),
    };

    await visitor.save();

    return response.json({
      success: true,
      message: "Precise location securely updated with visitor consent.",
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * Update Location Prompt Consent Status
 */
app.post("/api/tracking/consent", async (request, response, next) => {
  try {
    const { visitorId, promptDismissed = true, consented = false } =
      request.body || {};

    if (!visitorId) {
      return response.status(400).json({ message: "visitorId is required." });
    }

    await Visitor.findOneAndUpdate(
      { visitorId: visitorId.trim() },
      {
        $set: {
          "consentMetadata.promptShown": true,
          "consentMetadata.promptDismissed": Boolean(promptDismissed),
          "consentMetadata.locationConsentGranted": Boolean(consented),
          "consentMetadata.consentedAt": consented ? new Date() : null,
        },
      }
    );

    return response.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

// ============================================================================
// 2. ADMIN ANALYTICS & VISITOR MANAGEMENT
// ============================================================================

/**
 * Comprehensive Analytics Dashboard Data
 */
app.get("/api/admin/analytics", requireAdmin, async (_request, response, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalUniqueVisitors,
      totalVisits,
      repeatVisitorsCount,
      visitsToday,
      visitorsToday,
      topCountries,
      deviceStats,
      topSections,
      recentVisits,
    ] = await Promise.all([
      Visitor.countDocuments(),
      Visit.countDocuments(),
      Visitor.countDocuments({ visitCount: { $gt: 1 } }),
      Visit.countDocuments({ timestamp: { $gte: startOfToday } }),
      Visitor.countDocuments({ lastSeen: { $gte: startOfToday } }),

      // Top countries breakdown
      Visitor.aggregate([
        {
          $group: {
            _id: "$approxGeo.country",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Device category breakdown
      Visitor.aggregate([
        {
          $group: {
            _id: "$lastDevice.category",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // Top sections viewed
      Visit.aggregate([
        {
          $group: {
            _id: "$section",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),

      // Recent 30 visits
      Visit.find()
        .sort({ timestamp: -1 })
        .limit(30)
        .lean(),
    ]);

    const repeatVisitorRate =
      totalUniqueVisitors > 0
        ? Math.round((repeatVisitorsCount / totalUniqueVisitors) * 100)
        : 0;

    return response.json({
      metrics: {
        totalUniqueVisitors,
        totalVisits,
        repeatVisitorsCount,
        repeatVisitorRate: `${repeatVisitorRate}%`,
        visitsToday,
        visitorsToday,
      },
      topCountries: topCountries.map((c) => ({
        country: c._id || "Unknown",
        count: c.count,
      })),
      deviceStats: deviceStats.map((d) => ({
        category: d._id || "unknown",
        count: d.count,
      })),
      topSections: topSections.map((s) => ({
        section: s._id || "home",
        count: s.count,
      })),
      recentVisits,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * List Visitors Directory (Restricted to Authenticated Admin)
 * Precise coordinates are included strictly in this authenticated response.
 */
app.get("/api/admin/visitors", requireAdmin, async (request, response, next) => {
  try {
    const limit = Math.min(Math.max(Number(request.query.limit) || 50, 1), 100);
    const visitors = await Visitor.find()
      .sort({ lastSeen: -1 })
      .limit(limit)
      .lean();

    return response.json({ visitors });
  } catch (error) {
    return next(error);
  }
});

/**
 * Delete a specific Visitor record and their associated Visits (Right-to-Erasure / GDPR)
 */
app.delete("/api/admin/visitors/:visitorId", requireAdmin, async (request, response, next) => {
  try {
    const { visitorId } = request.params;
    if (!visitorId) {
      return response.status(400).json({ message: "visitorId is required." });
    }

    const [visitorResult, visitsResult] = await Promise.all([
      Visitor.deleteOne({ visitorId }),
      Visit.deleteMany({ visitorId }),
    ]);

    if (visitorResult.deletedCount === 0) {
      return response.status(404).json({ message: "Visitor record not found." });
    }

    return response.json({
      message: "Visitor record and associated visit history permanently deleted.",
      visitsDeleted: visitsResult.deletedCount,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * Data Retention Policy: Purge visits older than specified days
 */
app.post("/api/admin/retention/purge", requireAdmin, async (request, response, next) => {
  try {
    const days = Math.max(Number(request.body.days) || 90, 7);
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await Visit.deleteMany({ timestamp: { $lt: cutoffDate } });

    return response.json({
      message: `Successfully purged visits older than ${days} days.`,
      purgedCount: result.deletedCount,
      cutoffDate,
    });
  } catch (error) {
    return next(error);
  }
});

// ============================================================================
// 3. ADMIN UPLOADS & CONTACTS MANAGEMENT (Existing preserved + extended)
// ============================================================================

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

app.get("/api/admin/contacts", requireAdmin, async (request, response, next) => {
  try {
    const limit = Math.min(Math.max(Number(request.query.limit) || 50, 1), 100);
    const contacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return response.json({ contacts });
  } catch (error) {
    return next(error);
  }
});

app.patch("/api/admin/contacts/:id", requireAdmin, async (request, response, next) => {
  try {
    const { read, status } = request.body || {};
    const updates = {};

    if (typeof read === "boolean") {
      updates.read = read;
    }
    if (status && ["pending", "replied", "archived"].includes(status)) {
      updates.status = status;
    }

    const contact = await Contact.findByIdAndUpdate(
      request.params.id,
      { $set: updates },
      { new: true }
    );

    if (!contact) {
      return response.status(404).json({ message: "Contact message not found." });
    }

    return response.json({ message: "Contact updated.", contact });
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/admin/contacts/:id", requireAdmin, async (request, response, next) => {
  try {
    const contactRecord = await Contact.findById(request.params.id);
    if (!contactRecord) {
      return response.status(404).json({ message: "Contact message not found." });
    }

    await contactRecord.deleteOne();
    return response.json({ message: "Contact message deleted." });
  } catch (error) {
    return next(error);
  }
});

// ============================================================================
// 4. PUBLIC CONTACT & UPLOAD SUBMISSIONS
// ============================================================================

app.post("/api/contact", async (request, response, next) => {
  try {
    const { name, email, subject, message } = request.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return response.status(400).json({ message: "Name is required." });
    }
    if (!email || typeof email !== "string" || !email.trim()) {
      return response.status(400).json({ message: "Email is required." });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return response.status(400).json({ message: "Message is required." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return response.status(400).json({ message: "Please provide a valid email address." });
    }

    const contact = await Contact.create({
      name: name.trim().slice(0, 100),
      email: email.trim().toLowerCase().slice(0, 200),
      subject: subject && typeof subject === "string" && subject.trim()
        ? subject.trim().slice(0, 200)
        : "Portfolio Inquiry",
      message: message.trim().slice(0, 5000),
      read: false,
      status: "pending",
    });

    return response.status(201).json({
      message: "Message received successfully.",
      id: contact.id,
      createdAt: contact.createdAt,
    });
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

// ============================================================================
// 5. MUSIC STREAMING & MUSIC MANAGEMENT
// ============================================================================

app.get("/api/music/stream/:id", createStreamHandler(s3));
app.get("/api/music/cover/:id", createCoverHandler(s3));
app.use("/api/music", musicRoutes);
app.use("/api/admin/music", requireAdmin, createAdminMusicRouter(s3));

// Static files for portfolio and dedicated /music and /admin/music routes
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const simplePortfolioDir = path.resolve(__dirname, "../../../simple-portfolio");
if (fs.existsSync(simplePortfolioDir)) {
  app.get(/^\/music\/?$/, (_req, res) => {
    res.sendFile(path.join(simplePortfolioDir, "music", "index.html"));
  });
  app.get(/^\/admin\/music\/?$/, (_req, res) => {
    res.sendFile(path.join(simplePortfolioDir, "admin", "music", "index.html"));
  });
  app.use(express.static(simplePortfolioDir));
}

app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return response.status(413).json({ message: "File exceeds the configured size limit." });
  }
  console.error(error);
  return response.status(500).json({ message: error.message || "The request could not be completed." });
});

const connectToMongoDb = async () => {
  const attempts = 5;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log("Connected to MongoDB successfully.");
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
    console.log(`Server listening on port ${port}`);
  });
} catch (error) {
  console.error("Server could not start:", error.message);
  if (error.cause) {
    console.error("MongoDB connection detail:", error.cause.message);
  }
  process.exitCode = 1;
}
