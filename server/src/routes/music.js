import express from "express";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import Song from "../models/Song.js";
import Playlist from "../models/Playlist.js";

const router = express.Router();

export const getAudioMimeType = (format) => {
  const map = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    wave: "audio/wav",
    flac: "audio/flac",
    aac: "audio/aac",
    m4a: "audio/mp4",
    ogg: "audio/ogg",
    oga: "audio/ogg",
    opus: "audio/opus",
    weba: "audio/webm",
  };
  return map[String(format).toLowerCase()] || "audio/mpeg";
};

/**
 * GET /api/music/songs
 * Public songs listing with filtering, searching, and pagination
 */
router.get("/songs", async (request, response, next) => {
  try {
    const {
      search = "",
      genre = "",
      artist = "",
      album = "",
      sort = "newest",
      page = 1,
      limit = 50,
    } = request.query;

    const query = { visibility: "public" };

    if (genre && genre !== "All") {
      query.genre = new RegExp(`^${genre.trim()}$`, "i");
    }

    if (artist) {
      query.artist = new RegExp(artist.trim(), "i");
    }

    if (album) {
      query.album = new RegExp(album.trim(), "i");
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
    else if (sort === "popular") sortOptions.playCount = -1;
    else if (sort === "title") sortOptions.title = 1;
    else if (sort === "duration") sortOptions.duration = -1;
    else sortOptions.createdAt = -1;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [songs, total, genres] = await Promise.all([
      Song.find(query).sort(sortOptions).skip(skip).limit(limitNum).lean(),
      Song.countDocuments(query),
      Song.distinct("genre", { visibility: "public" }),
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

/**
 * GET /api/music/genres
 * Distinct genres list for public songs
 */
router.get("/genres", async (_request, response, next) => {
  try {
    const genres = await Song.distinct("genre", { visibility: "public" });
    return response.json({ genres: genres.filter(Boolean).sort() });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/music/playlists
 * Public playlists with songs populated
 */
router.get("/playlists", async (_request, response, next) => {
  try {
    const playlists = await Playlist.find({ visibility: "public" })
      .populate({
        path: "songs",
        match: { visibility: "public" },
      })
      .sort({ createdAt: -1 })
      .lean();

    return response.json({ playlists });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/music/playlists/:id
 * Single public playlist
 */
router.get("/playlists/:id", async (request, response, next) => {
  try {
    const playlist = await Playlist.findOne({
      _id: request.params.id,
      visibility: "public",
    })
      .populate({
        path: "songs",
        match: { visibility: "public" },
      })
      .lean();

    if (!playlist) {
      return response.status(404).json({ message: "Playlist not found." });
    }

    return response.json({ playlist });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/music/songs/:id
 * Single song details
 */
router.get("/songs/:id", async (request, response, next) => {
  try {
    const song = await Song.findById(request.params.id).lean();
    if (!song) {
      return response.status(404).json({ message: "Song not found." });
    }

    if (song.visibility === "private") {
      const authHeader = request.get("authorization") || "";
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length).trim()
        : request.query.token || "";
      if (!token || token !== process.env.ADMIN_TOKEN) {
        return response.status(403).json({ message: "Song is private." });
      }
    }

    return response.json({ song });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/music/songs/:id/play
 * Increment play count
 */
router.post(["/songs/:id/play", "/play/:id"], async (request, response, next) => {
  try {
    const updated = await Song.findByIdAndUpdate(
      request.params.id,
      { $inc: { playCount: 1 } },
      { new: true }
    );
    return response.json({ success: true, playCount: updated ? updated.playCount : 1 });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/music/stream/:id
 * Dedicated HTTP Audio Streaming with HTTP Range requests (206 Partial Content)
 */
export const createStreamHandler = (s3) => {
  return async (request, response, next) => {
    try {
      const song = await Song.findById(request.params.id).lean();
      if (!song) {
        return response.status(404).json({ message: "Audio track not found." });
      }

      // Private song authorization check
      if (song.visibility === "private") {
        const authHeader = request.get("authorization") || "";
        const token = authHeader.startsWith("Bearer ")
          ? authHeader.slice("Bearer ".length).trim()
          : (request.get("x-admin-token") || request.query.token || "");

        if (!token || token !== process.env.ADMIN_TOKEN) {
          return response.status(403).json({ message: "Access denied to private track." });
        }
      }

      const totalSize = Number(song.fileSize || 0);
      const mimeType = getAudioMimeType(song.format);
      const range = request.headers.range;

      if (range && totalSize > 0) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

        // 416 Range Not Satisfiable
        if (
          Number.isNaN(start) ||
          start >= totalSize ||
          (end !== undefined && end >= totalSize) ||
          start > end
        ) {
          response.status(416);
          response.set({
            "Content-Range": `bytes */${totalSize}`,
          });
          return response.end();
        }

        const chunkSize = end - start + 1;
        const s3Command = new GetObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: song.storageKey,
          Range: `bytes=${start}-${end}`,
        });

        const s3Response = await s3.send(s3Command);

        response.status(206);
        response.set({
          "Content-Range": `bytes ${start}-${end}/${totalSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": mimeType,
          "Cache-Control":
            song.visibility === "public"
              ? "public, max-age=86400, stale-while-revalidate=604800"
              : "private, no-cache",
        });

        s3Response.Body.pipe(response);

        response.on("close", () => {
          if (s3Response.Body && typeof s3Response.Body.destroy === "function") {
            s3Response.Body.destroy();
          }
        });
      } else {
        // Normal 200 OK stream without range header
        const s3Command = new GetObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: song.storageKey,
        });

        const s3Response = await s3.send(s3Command);

        response.status(200);
        response.set({
          "Content-Length": totalSize || s3Response.ContentLength,
          "Content-Type": mimeType,
          "Accept-Ranges": "bytes",
          "Cache-Control":
            song.visibility === "public"
              ? "public, max-age=86400"
              : "private, no-cache",
        });

        s3Response.Body.pipe(response);

        response.on("close", () => {
          if (s3Response.Body && typeof s3Response.Body.destroy === "function") {
            s3Response.Body.destroy();
          }
        });
      }
    } catch (error) {
      if (error.name === "NoSuchKey") {
        return response.status(404).json({ message: "Audio file not found in storage." });
      }
      return next(error);
    }
  };
};

/**
 * GET /api/music/cover/:id
 * Streams cover artwork directly from Cloudflare R2
 */
export const createCoverHandler = (s3) => {
  return async (request, response, next) => {
    try {
      const song = await Song.findById(request.params.id).lean();
      if (!song || !song.coverArtKey) {
        // Deliver clean SVG placeholder
        response.setHeader("Content-Type", "image/svg+xml");
        response.setHeader("Cache-Control", "public, max-age=86400");
        return response.send(`
          <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
            <rect width="100%" height="100%" fill="#1a1e24"/>
            <text x="50%" y="54%" font-family="sans-serif" font-size="72" fill="#60a5fa" text-anchor="middle" dominant-baseline="middle">🎵</text>
          </svg>
        `);
      }

      const s3Command = new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: song.coverArtKey,
      });

      const s3Response = await s3.send(s3Command);
      response.status(200);
      response.setHeader("Content-Type", s3Response.ContentType || "image/jpeg");
      response.setHeader("Cache-Control", "public, max-age=604800");
      if (s3Response.ContentLength) {
        response.setHeader("Content-Length", s3Response.ContentLength);
      }
      s3Response.Body.pipe(response);
    } catch (err) {
      if (err.name === "NoSuchKey") {
        return response.status(404).send("Cover not found");
      }
      return next(err);
    }
  };
};

export default router;
