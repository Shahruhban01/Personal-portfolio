import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
  {
    visitorId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    firstSeen: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
      index: true,
    },
    visitCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    // Approximate IP-based geographic information
    approxGeo: {
      country: { type: String, default: "Unknown" },
      countryCode: { type: String, default: "" },
      region: { type: String, default: "" },
      city: { type: String, default: "" },
      timezone: { type: String, default: "" },
    },
    // Location source: 'ip_estimated', 'precise_gps', or 'unknown'
    locationSource: {
      type: String,
      enum: ["ip_estimated", "precise_gps", "unknown"],
      default: "unknown",
      index: true,
    },
    // Optional precise coordinates (only collected with explicit user consent)
    preciseLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      accuracy: { type: Number, default: null }, // In meters
      collectedAt: { type: Date, default: null },
    },
    // Consent and collection metadata
    consentMetadata: {
      promptShown: { type: Boolean, default: false },
      locationConsentGranted: { type: Boolean, default: false },
      promptDismissed: { type: Boolean, default: false },
      consentedAt: { type: Date, default: null },
    },
    // Device category and browser info
    lastDevice: {
      category: {
        type: String,
        enum: ["desktop", "mobile", "tablet", "unknown"],
        default: "unknown",
      },
      browser: { type: String, default: "Unknown" },
      os: { type: String, default: "Unknown" },
      userAgent: { type: String, default: "" },
    },
    // Privacy-preserving anonymized IP identifier (never raw IP indefinitely)
    anonymizedIp: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for checking if repeat visitor
visitorSchema.virtual("isRepeatVisitor").get(function () {
  return this.visitCount > 1;
});

const Visitor = mongoose.model("Visitor", visitorSchema);

export default Visitor;
