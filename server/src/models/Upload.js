import mongoose from "mongoose";

const uploadSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      trim: true,
      maxlength: 10000,
    },
    file: {
      key: { type: String },
      name: { type: String },
      contentType: { type: String },
      size: { type: Number },
      url: { type: String },
    },
  },
  { timestamps: true },
);

uploadSchema.index({ createdAt: -1 });

export default mongoose.model("Upload", uploadSchema);
