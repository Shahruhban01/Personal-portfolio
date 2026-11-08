import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    artist: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      default: "Unknown Artist",
    },
    album: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    genre: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "General",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],
    duration: {
      type: Number,
      default: 0,
    },
    format: {
      type: String,
      trim: true,
      lowercase: true,
      default: "mp3",
    },
    bitrate: {
      type: Number,
      default: 0,
    },
    sampleRate: {
      type: Number,
      default: 0,
    },
    fileSize: {
      type: Number,
      required: true,
      default: 0,
    },
    storageKey: {
      type: String,
      required: true,
      unique: true,
    },
    storageUrl: {
      type: String,
      default: "",
    },
    coverArtKey: {
      type: String,
      default: "",
    },
    coverArtUrl: {
      type: String,
      default: "",
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
      index: true,
    },
    releaseDate: {
      type: Date,
      default: null,
    },
    playCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

songSchema.index({ title: "text", artist: "text", album: "text", genre: "text" });
songSchema.index({ visibility: 1, createdAt: -1 });
songSchema.index({ visibility: 1, genre: 1 });
songSchema.index({ visibility: 1, playCount: -1 });

export default mongoose.models.Song || mongoose.model("Song", songSchema);

