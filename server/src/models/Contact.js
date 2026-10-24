import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "General Inquiry",
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "replied", "archived"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

contactSchema.index({ createdAt: -1 });

export default mongoose.model("Contact", contactSchema);
