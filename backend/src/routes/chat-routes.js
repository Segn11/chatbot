import { Router } from "express";
import { verifyToken } from "../libs/jwt-token-generator.js";
import { chatCompletionValidator, validate } from "../libs/data-validator.js";
import {
  generateChatCompletion,
  sendChatsToUser,
  deleteChats,
} from "../handlers/chat-controllers.js";
import { chatLimiter } from "../libs/rate-limiter.js";

const chatRoutes = Router();

chatRoutes.post("/new", chatLimiter, validate(chatCompletionValidator), verifyToken, generateChatCompletion);
chatRoutes.get("/all-chats", verifyToken, sendChatsToUser);
chatRoutes.delete("/delete", verifyToken, deleteChats);

export default chatRoutes;
