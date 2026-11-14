import { Router } from "express";
import { verifyToken } from "../libs/jwt-token-generator.js";
import {
  chatCompletionValidator,
  conversationTitleValidator,
  validate,
} from "../libs/data-validator.js";
import {
  generateChatCompletion,
  sendChatsToUser,
  deleteChats,
  getUserConversations,
  getConversationById,
  createConversation,
  renameConversation,
  deleteConversation,
} from "../handlers/chat-controllers.js";
import { chatLimiter } from "../libs/rate-limiter.js";

const chatRoutes = Router();

// Multi-session conversation management
chatRoutes.get("/conversations", verifyToken, getUserConversations);
chatRoutes.post("/conversations", verifyToken, createConversation);
chatRoutes.get("/conversation/:id", verifyToken, getConversationById);
chatRoutes.put(
  "/conversation/:id",
  verifyToken,
  validate(conversationTitleValidator),
  renameConversation
);
chatRoutes.delete("/conversation/:id", verifyToken, deleteConversation);

// Chat message dispatch & retrieval
chatRoutes.post(
  "/new",
  chatLimiter,
  validate(chatCompletionValidator),
  verifyToken,
  generateChatCompletion
);
chatRoutes.get("/all-chats", verifyToken, sendChatsToUser);
chatRoutes.delete("/delete", verifyToken, deleteChats);

export default chatRoutes;
