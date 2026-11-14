import mongoose from "mongoose";
import { randomUUID } from "crypto";

const messageSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => randomUUID(),
  },
  role: {
    type: String,
    enum: ["user", "assistant", "system"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const conversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "New Chat",
      trim: true,
      maxLength: 120,
    },
    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for fast retrieval of user conversations ordered by latest activity
conversationSchema.index({ user: 1, updatedAt: -1 });

export default mongoose.model("Conversation", conversationSchema);
