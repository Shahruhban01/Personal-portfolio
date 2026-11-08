import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    coverArtUrl: {
      type: String,
      default: "",
    },
    songs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

playlistSchema.index({ visibility: 1, createdAt: -1 });

export default mongoose.models.Playlist || mongoose.model("Playlist", playlistSchema);

