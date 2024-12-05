import { Router } from "express";

import { verifyToken } from "../libs/jwt-token-generator.js";
import { chatCompletionValidator, validate } from "../libs/data-validator.js";
import { generateChatCompletion } from "../handlers/chat-controllers.js";

// protected API

const chatRoutes = Router();
chatRoutes.post("/new", validate(chatCompletionValidator), verifyToken, generateChatCompletion)

export default chatRoutes;