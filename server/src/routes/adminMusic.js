import express from "express";
import crypto from "node:crypto";
import path from "node:path";
import { parseBuffer } from "music-metadata";
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListMultipartUploadsCommand,
  PutObjectCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Song from "../models/Song.js";
import Playlist from "../models/Playlist.js";
import { getAudioMimeType } from "./music.js";

const router = express.Router();

const ALLOWED_AUDIO_EXTENSIONS = [".mp3", ".wav", ".flac", ".aac", ".m4a", ".ogg", ".opus"];
const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const MAX_AUDIO_SIZE = Number(process.env.MAX_MUSIC_FILE_SIZE_BYTES || 200 * 1024 * 1024); // 200 MB
const MAX_COVER_SIZE = 10 * 1024 * 1024; // 10 MB
const PART_SIZE = 5 * 1024 * 1024; // 5 MB S3 standard chunk size

export const createAdminMusicRouter = (s3) => {
  /**
   * Helper: delete object from Cloudflare R2
   */
  async function deleteFromR2(key) {
    if (!key) return;
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
        })
      );
    } catch (err) {
      console.warn(`Failed to delete R2 key ${key}:`, err.message);
    }
  }

  /**
   * GET /api/admin/music/overview
   * Dashboard metrics
   */
  router.get("/overview", async (_request, response, next) => {
    try {
      const [
        totalSongs,
        publicSongs,
        privateSongs,
        storageAgg,
        recentSongs,
        totalPlaylists,
      ] = await Promise.all([
        Song.countDocuments(),
        Song.countDocuments({ visibility: "public" }),
        Song.countDocuments({ visibility: "private" }),
        Song.aggregate([
          {
            $group: {
              _id: null,
              totalBytes: { $sum: "$fileSize" },
            },
          },
        ]),
        Song.find().sort({ createdAt: -1 }).limit(5).lean(),
        Playlist.countDocuments(),
      ]);

      const totalStorageBytes = storageAgg[0]?.totalBytes || 0;

      return response.json({
        totalSongs,
        publicSongs,
        privateSongs,
        totalStorageBytes,
        totalPlaylists,
        maxUploadBytes: MAX_AUDIO_SIZE,
        recentSongs,
      });
    } catch (error) {
      return next(error);
    }
  });

  /**
   * GET /api/admin/music/songs
   * List songs with filters, search, and pagination
   */
  router.get("/songs", async (request, response, next) => {
    try {
      const {
        search = "",
        visibility = "all",
        genre = "",
        sort = "newest",
        page = 1,
        limit = 50,
      } = request.query;

      const query = {};

      if (visibility === "public" || visibility === "private") {
        query.visibility = visibility;
      }

      if (genre && genre !== "All") {
        query.genre = new RegExp(`^${genre.trim()}$`, "i");
      }

      if (search && search.trim()) {
        const s = search.trim();
        query.$or = [
          { title: new RegExp(s, "i") },
          { artist: new RegExp(s, "i") },
          { album: new RegExp(s, "i") },
          { genre: new RegExp(s, "i") },
          { tags: new RegExp(s, "i") },
        ];
      }

      const sortOptions = {};
      if (sort === "newest") sortOptions.createdAt = -1;
      else if (sort === "oldest") sortOptions.createdAt = 1;
      else if (sort === "title") sortOptions.title = 1;
      else if (sort === "artist") sortOptions.artist = 1;
      else if (sort === "duration") sortOptions.duration = -1;
      else if (sort === "size") sortOptions.fileSize = -1;
      else sortOptions.createdAt = -1;

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
      const skip = (pageNum - 1) * limitNum;

      const [songs, total, genres] = await Promise.all([
        Song.find(query).sort(sortOptions).skip(skip).limit(limitNum).lean(),
        Song.countDocuments(query),
        Song.distinct("genre"),
      ]);

      return response.json({
        songs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
        genres: genres.filter(Boolean).sort(),
      });
    } catch (error) {
      return next(error);
    }
  });

  // =========================================================================
  // REAL-TIME R2 MULTIPART UPLOAD & PRESIGNED URLS
  // =========================================================================

  /**
   * POST /api/admin/music/upload/init
   * Initiates multipart upload in Cloudflare R2 and returns presigned chunk URLs
   */
  router.post("/upload/init", async (request, response, next) => {
    try {
      const { filename, fileSize, mimeType, isCover = false } = request.body || {};

      if (!filename || typeof filename !== "string") {
        return response.status(400).json({ message: "Filename is required." });
      }

      const ext = path.extname(filename).toLowerCase();
      const year = new Date().getFullYear();

      if (isCover) {
        // Cover Image Upload Init
        if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
          return response.status(400).json({
            message: `Unsupported image format (${ext}). Allowed: ${ALLOWED_IMAGE_EXTENSIONS.join(", ")}`,
          });
        }
        if (fileSize > MAX_COVER_SIZE) {
          return response.status(400).json({ message: "Cover image exceeds 10 MB limit." });
        }

        const coverKey = `music/covers/${year}/${crypto.randomUUID()}${ext}`;
        const presignedUrl = await getSignedUrl(
          s3,
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: coverKey,
            ContentType: mimeType || "image/jpeg",
          }),
          { expiresIn: 1800 }
        );

        return response.json({
          uploadType: "single",
          storageKey: coverKey,
          presignedUrl,
        });
      }

      // Audio File Multipart Upload Init
      if (!ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
        return response.status(400).json({
          message: `Unsupported audio format (${ext}). Allowed: ${ALLOWED_AUDIO_EXTENSIONS.join(", ")}`,
        });
      }

      const sizeNum = Number(fileSize);
      if (!sizeNum || sizeNum <= 0) {
        return response.status(400).json({ message: "Valid fileSize in bytes is required." });
      }
      if (sizeNum > MAX_AUDIO_SIZE) {
        return response.status(400).json({
          message: `File size (${(sizeNum / 1048576).toFixed(1)} MB) exceeds allowed limit of ${MAX_AUDIO_SIZE / 1048576} MB.`,
        });
      }

      const storageKey = `music/songs/${year}/${crypto.randomUUID()}${ext}`;
      const audioMime = mimeType || getAudioMimeType(ext);

      // Create Multipart Upload in R2
      const multipart = await s3.send(
        new CreateMultipartUploadCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: storageKey,
          ContentType: audioMime,
        })
      );

      const uploadId = multipart.UploadId;
      const numParts = Math.max(1, Math.ceil(sizeNum / PART_SIZE));
      const parts = [];

      // Generate presigned URL for each chunk
      for (let partNumber = 1; partNumber <= numParts; partNumber++) {
        const presignedUrl = await getSignedUrl(
          s3,
          new UploadPartCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: storageKey,
            UploadId: uploadId,
            PartNumber: partNumber,
          }),
          { expiresIn: 7200 }
        );

        parts.push({
          partNumber,
          presignedUrl,
          proxyUrl: `/api/admin/music/upload/part?uploadId=${encodeURIComponent(uploadId)}&partNumber=${partNumber}&storageKey=${encodeURIComponent(storageKey)}`,
        });
      }

      return response.json({
        uploadType: "multipart",
        uploadId,
        storageKey,
        partSize: PART_SIZE,
        numParts,
        parts,
      });
    } catch (error) {
      return next(error);
    }
  });

  /**
   * PUT /api/admin/music/upload/part
   * Streams a file part directly to Cloudflare R2 UploadPartCommand (no disk saving, no full-file memory)
   */
  router.put("/upload/part", async (request, response, next) => {
    try {
      const { uploadId, partNumber, storageKey } = request.query;

      if (!uploadId || !partNumber || !storageKey) {
        return response.status(400).json({ message: "uploadId, partNumber, and storageKey are required." });
      }

      const contentLength = Number(request.headers["content-length"]);
      if (!contentLength) {
        return response.status(400).json({ message: "Content-Length header is required." });
      }

      const partNum = parseInt(partNumber, 10);

      const uploadPartRes = await s3.send(
        new UploadPartCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: storageKey,
          UploadId: uploadId,
          PartNumber: partNum,
          Body: request,
          ContentLength: contentLength,
        })
      );

      return response.json({
        partNumber: partNum,
        etag: uploadPartRes.ETag,
        ETag: uploadPartRes.ETag,
      });
    } catch (error) {
      return next(error);
    }
  });

  /**
   * POST /api/admin/music/upload/complete
   * Finalizes multipart upload in R2, verifies file size, extracts metadata, saves to MongoDB
   */
  router.post("/upload/complete", async (request, response, next) => {
    try {
      const {
        uploadId,
        storageKey,
        parts,
        title,
        artist,
        album,
        genre,
        description,
        tags,
        visibility = "public",
        releaseDate,
        coverKey = "",
        clientDuration = 0,
      } = request.body || {};

      if (!uploadId || !storageKey || !Array.isArray(parts) || parts.length === 0) {
        return response.status(400).json({ message: "uploadId, storageKey, and parts array are required." });
      }

      // Normalize and sort parts numerically by PartNumber
      const sortedParts = [...parts]
        .map((p) => ({
          PartNumber: Number(p.PartNumber || p.partNumber),
          ETag: p.ETag || p.etag,
        }))
        .filter((p) => p.PartNumber && p.ETag)
        .sort((a, b) => a.PartNumber - b.PartNumber);

      // Finalize Multipart Upload in Cloudflare R2
      await s3.send(
        new CompleteMultipartUploadCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: storageKey,
          UploadId: uploadId,
          MultipartUpload: { Parts: sortedParts },
        })
      );

      // Verify file presence & get actual size from R2
      const head = await s3.send(
        new HeadObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: storageKey,
        })
      );

      const actualFileSize = head.ContentLength || 0;
      const ext = path.extname(storageKey).replace(".", "").toLowerCase();

      // Attempt reading first 128KB of audio header to extract metadata
      let duration = clientDuration ? Math.round(Number(clientDuration) * 100) / 100 : 0;
      let bitrate = 0;
      let sampleRate = 0;
      let extractedTitle = "";
      let extractedArtist = "";
      let extractedAlbum = "";
      let extractedGenre = "";

      try {
        const headerRes = await s3.send(
          new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: storageKey,
            Range: "bytes=0-131071", // First 128 KB
          })
        );

        const chunks = [];
        for await (const chunk of headerRes.Body) {
          chunks.push(chunk);
        }
        const headerBuffer = Buffer.concat(chunks);
        const meta = await parseBuffer(headerBuffer, {
          mimeType: getAudioMimeType(ext),
          size: actualFileSize,
        });

        if (meta?.format?.duration) {
          duration = Math.round(meta.format.duration * 100) / 100;
        }
        if (meta?.format?.bitrate) bitrate = meta.format.bitrate;
        if (meta?.format?.sampleRate) sampleRate = meta.format.sampleRate;
        if (meta?.common?.title) extractedTitle = meta.common.title;
        if (meta?.common?.artist) extractedArtist = meta.common.artist;
        if (meta?.common?.album) extractedAlbum = meta.common.album;
        if (meta?.common?.genre?.[0]) extractedGenre = meta.common.genre[0];
      } catch (_metaErr) {
        // Fallback gracefully to client-reported metadata and form fields
      }

      const baseName = path.basename(storageKey, path.extname(storageKey));
      const finalTitle = (title || extractedTitle || baseName).trim().slice(0, 200);
      const finalArtist = (artist || extractedArtist || "Unknown Artist").trim().slice(0, 200);
      const finalAlbum = (album || extractedAlbum || "").trim().slice(0, 200);
      const finalGenre = (genre || extractedGenre || "General").trim().slice(0, 100);

      let parsedTags = [];
      if (Array.isArray(tags)) {
        parsedTags = tags.map((t) => String(t).trim().slice(0, 50)).filter(Boolean);
      } else if (typeof tags === "string") {
        parsedTags = tags
          .split(",")
          .map((t) => t.trim().slice(0, 50))
          .filter(Boolean);
      }

      let parsedReleaseDate = null;
      if (releaseDate) {
        const d = new Date(releaseDate);
        if (!Number.isNaN(d.getTime())) parsedReleaseDate = d;
      }

      const publicBase = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/$/, "");
      const storageUrl = publicBase ? `${publicBase}/${storageKey}` : `/api/music/stream/${storageKey}`;
      const coverArtUrl = coverKey
        ? (publicBase ? `${publicBase}/${coverKey}` : `/api/music/cover/${coverKey}`)
        : "";

      // Create Song document in MongoDB
      const song = await Song.create({
        title: finalTitle,
        artist: finalArtist,
        album: finalAlbum,
        genre: finalGenre,
        description: (description || "").trim().slice(0, 2000),
        tags: parsedTags,
        duration,
        format: ext,
        bitrate,
        sampleRate,
        fileSize: actualFileSize,
        storageKey,
        storageUrl,
        coverArtKey: coverKey || "",
        coverArtUrl,
        visibility: visibility === "private" ? "private" : "public",
        releaseDate: parsedReleaseDate,
      });

      return response.status(201).json({
        message: "Song uploaded and saved successfully.",
        song,
      });
    } catch (error) {
      return next(error);
    }
  });

  /**
   * POST /api/admin/music/upload/abort
   * Aborts an incomplete multipart upload in R2 and cleans up partial chunks
   */
  router.post("/upload/abort", async (request, response, next) => {
    try {
      const { uploadId, storageKey } = request.body || {};
      if (uploadId && storageKey) {
        await s3.send(
          new AbortMultipartUploadCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: storageKey,
            UploadId: uploadId,
          })
        );
      }
      return response.json({ message: "Upload aborted and storage cleaned up." });
    } catch (error) {
      return next(error);
    }
  });

  /**
   * PUT /api/admin/music/songs/:id
   * Update song metadata
   */
  router.put(["/songs/:id", "/song/:id"], async (request, response, next) => {
    try {
      const {
        title,
        artist,
        album,
        genre,
        description,
        tags,
        visibility,
        releaseDate,
      } = request.body || {};

      const updates = {};
      if (title !== undefined) updates.title = String(title).trim().slice(0, 200);
      if (artist !== undefined) updates.artist = String(artist).trim().slice(0, 200);
      if (album !== undefined) updates.album = String(album).trim().slice(0, 200);
      if (genre !== undefined) updates.genre = String(genre).trim().slice(0, 100);
      if (description !== undefined) updates.description = String(description).trim().slice(0, 2000);
      if (visibility && ["public", "private"].includes(visibility)) {
        updates.visibility = visibility;
      }
      if (Array.isArray(tags)) {
        updates.tags = tags.map((t) => String(t).trim().slice(0, 50)).filter(Boolean);
      } else if (typeof tags === "string") {
        updates.tags = tags
          .split(",")
          .map((t) => t.trim().slice(0, 50))
          .filter(Boolean);
      }
      if (releaseDate !== undefined) {
        updates.releaseDate = releaseDate ? new Date(releaseDate) : null;
      }

      const song = await Song.findByIdAndUpdate(
        request.params.id,
        { $set: updates },
        { new: true }
      );

      if (!song) {
        return response.status(404).json({ message: "Song not found." });
      }

      return response.json({ message: "Song updated successfully.", song });
    } catch (error) {
      return next(error);
    }
  });

  /**
   * DELETE /api/admin/music/songs/:id
   * Deletes song document, R2 audio file, R2 cover art, and cleans up playlists
   */
  router.delete(["/songs/:id", "/song/:id"], async (request, response, next) => {
    try {
      const song = await Song.findById(request.params.id);
      if (!song) {
        return response.status(404).json({ message: "Song not found." });
      }

      if (song.storageKey) {
        await deleteFromR2(song.storageKey);
      }
      if (song.coverArtKey) {
        await deleteFromR2(song.coverArtKey);
      }

      await Playlist.updateMany(
        { songs: song._id },
        { $pull: { songs: song._id } }
      );

      await song.deleteOne();

      return response.json({
        message: "Song and audio storage permanently deleted.",
        id: song._id,
      });
    } catch (error) {
      return next(error);
    }
  });

  /**
   * GET /api/admin/music/playlists
   * List all playlists
   */
  router.get("/playlists", async (_request, response, next) => {
    try {
      const playlists = await Playlist.find()
        .populate("songs")
        .sort({ createdAt: -1 })
        .lean();

      return response.json({ playlists });
    } catch (error) {
      return next(error);
    }
  });

  /**
   * POST /api/admin/music/playlists
   * Create playlist
   */
  router.post("/playlists", async (request, response, next) => {
    try {
      const { name, description = "", visibility = "public", songs = [] } = request.body || {};

      if (!name || typeof name !== "string" || !name.trim()) {
        return response.status(400).json({ message: "Playlist name is required." });
      }

      const playlist = await Playlist.create({
        name: name.trim().slice(0, 200),
        description: String(description).trim().slice(0, 2000),
        visibility: visibility === "private" ? "private" : "public",
        songs: Array.isArray(songs) ? songs : [],
      });

      const populated = await Playlist.findById(playlist._id).populate("songs");
      return response.status(201).json({ message: "Playlist created.", playlist: populated });
    } catch (error) {
      return next(error);
    }
  });

  /**
   * PUT /api/admin/music/playlists/:id
   * Update playlist
   */
  router.put(["/playlists/:id", "/playlist/:id"], async (request, response, next) => {
    try {
      const { name, description, visibility, songs, coverArtUrl } = request.body || {};
      const updates = {};

      if (name !== undefined) updates.name = String(name).trim().slice(0, 200);
      if (description !== undefined) updates.description = String(description).trim().slice(0, 2000);
      if (visibility && ["public", "private"].includes(visibility)) {
        updates.visibility = visibility;
      }
      if (coverArtUrl !== undefined) updates.coverArtUrl = String(coverArtUrl).trim();
      if (Array.isArray(songs)) updates.songs = songs;

      const playlist = await Playlist.findByIdAndUpdate(
        request.params.id,
        { $set: updates },
        { new: true }
      ).populate("songs");

      if (!playlist) {
        return response.status(404).json({ message: "Playlist not found." });
      }

      return response.json({ message: "Playlist updated.", playlist });
    } catch (error) {
      return next(error);
    }
  });

  /**
   * DELETE /api/admin/music/playlists/:id
   * Delete playlist
   */
  router.delete(["/playlists/:id", "/playlist/:id"], async (request, response, next) => {
    try {
      const playlist = await Playlist.findById(request.params.id);
      if (!playlist) {
        return response.status(404).json({ message: "Playlist not found." });
      }

      await playlist.deleteOne();
      return response.json({ message: "Playlist deleted." });
    } catch (error) {
      return next(error);
    }
  });

  /**
   * GET /api/admin/music/storage
   * Storage breakdown & diagnostics
   */
  router.get("/storage", async (_request, response, next) => {
    try {
      const [storageAgg, totalSongs, totalPlaylists] = await Promise.all([
        Song.aggregate([
          {
            $group: {
              _id: "$format",
              count: { $sum: 1 },
              bytes: { $sum: "$fileSize" },
            },
          },
        ]),
        Song.countDocuments(),
        Playlist.countDocuments(),
      ]);

      const totalBytes = storageAgg.reduce((acc, curr) => acc + curr.bytes, 0);

      return response.json({
        totalBytes,
        totalSongs,
        totalPlaylists,
        formatBreakdown: storageAgg,
        maxUploadBytes: MAX_AUDIO_SIZE,
      });
    } catch (error) {
      return next(error);
    }
  });

  /**
   * POST /api/admin/music/storage/cleanup
   * Cleans up abandoned / uncompleted multipart uploads in R2
   */
  router.post("/storage/cleanup", async (_request, response, next) => {
    try {
      const list = await s3.send(
        new ListMultipartUploadsCommand({
          Bucket: process.env.R2_BUCKET_NAME,
        })
      );

      let cleaned = 0;
      if (list.Uploads && list.Uploads.length > 0) {
        for (const u of list.Uploads) {
          // If older than 24 hours
          const ageHours = (Date.now() - new Date(u.Initiated).getTime()) / (1000 * 3600);
          if (ageHours > 24) {
            await s3.send(
              new AbortMultipartUploadCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: u.Key,
                UploadId: u.UploadId,
              })
            );
            cleaned++;
          }
        }
      }

      return response.json({
        message: `Storage cleanup complete. Cleaned ${cleaned} abandoned multipart upload(s).`,
        totalActiveUploads: list.Uploads?.length || 0,
        cleanedCount: cleaned,
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
};

export default router;
