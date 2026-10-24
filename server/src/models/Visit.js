import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
  {
    visitId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    visitorId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    page: {
      type: String,
      default: "/",
      trim: true,
    },
    section: {
      type: String,
      default: "home",
      trim: true,
    },
    referrer: {
      type: String,
      default: "",
      trim: true,
    },
    device: {
      category: {
        type: String,
        enum: ["desktop", "mobile", "tablet", "unknown"],
        default: "unknown",
      },
      browser: { type: String, default: "Unknown" },
      os: { type: String, default: "Unknown" },
    },
    location: {
      country: { type: String, default: "Unknown" },
      region: { type: String, default: "" },
      city: { type: String, default: "" },
      source: { type: String, default: "unknown" },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for deduplication and rapid session lookups
visitSchema.index({ visitorId: 1, sessionId: 1, section: 1, timestamp: -1 });

const Visit = mongoose.model("Visit", visitSchema);

export default Visit;
