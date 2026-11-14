import dotenv from "dotenv";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/User.js";

dotenv.config();

// Helper to get AI response with multi-provider failover
const getAIResponse = async (chats, message) => {
  let lastError = null;

  // 1. OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 25000,
        ...(process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : {}),
      });

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: chats,
      });

      if (completion.choices && completion.choices.length > 0) {
        return completion.choices[0].message.content;
      }
    } catch (err) {
      console.warn("OpenAI API attempt failed:", err.message);
      lastError = err;
    }
  }

  // 2. Google Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      });

      // Filter & normalize chat history for Gemini (strict user/model alternation)
      const validHistory = [];
      let lastRole = null;
      for (const msg of chats.slice(0, -1)) {
        const geminiRole = msg.role === "assistant" ? "model" : "user";
        if (validHistory.length === 0 && geminiRole !== "user") {
          continue; // Gemini history must begin with 'user'
        }
        if (geminiRole !== lastRole) {
          validHistory.push({
            role: geminiRole,
            parts: [{ text: msg.content }],
          });
          lastRole = geminiRole;
        }
      }

      // If the last role is user, remove it as sendMessage will send the current turn
      if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === "user") {
        validHistory.pop();
      }

      const chatSession = model.startChat({ history: validHistory });
      const result = await chatSession.sendMessage(message);
      return result.response.text();
    } catch (err) {
      console.warn("Gemini API attempt failed:", err.message);
      lastError = err;
    }
  }

  // 3. Grok (xAI)
  if (process.env.GROK_API_KEY) {
    try {
      const grokClient = new OpenAI({
        apiKey: process.env.GROK_API_KEY,
        baseURL: "https://api.x.ai/v1",
        timeout: 25000,
      });

      const completion = await grokClient.chat.completions.create({
        model: process.env.GROK_MODEL || "grok-2-latest",
        messages: chats,
      });

      if (completion.choices && completion.choices.length > 0) {
        return completion.choices[0].message.content;
      }
    } catch (err) {
      console.warn("Grok API attempt failed:", err.message);
      lastError = err;
    }
  }

  // If external keys were provided but failed
  if (lastError && (process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GROK_API_KEY)) {
    throw new Error(`AI Provider Service Error: ${lastError.message}`);
  }

  // Fallback demo response if no external API key is configured
  return (
    `[Local Demo Mode] Hello! I received your message: "${message}".\n\n` +
    `To enable live AI completions, please add an API key (OPENAI_API_KEY, GEMINI_API_KEY, or GROK_API_KEY) to backend/.env.`
  );
};

export const generateChatCompletion = async (req, res) => {
  try {
    const { message } = req.body;
    const user = await User.findById(res.locals.jwtData?.id);

    if (!user) {
      return res.status(401).json({ message: "User not registered or token invalid" });
    }

    // Build chat history
    const chats = user.chats.map(({ role, content }) => ({
      role,
      content,
    }));
    chats.push({ role: "user", content: message });

    // Generate AI response
    const aiMessage = await getAIResponse(chats, message);

    user.chats.push({ role: "user", content: message });
    user.chats.push({ role: "assistant", content: aiMessage });
    await user.save();

    return res.status(200).json({ chats: user.chats });
  } catch (error) {
    console.error("Error generating chat completion:", error.message);
    if (
      error.name === "MongooseServerSelectionError" ||
      error.name === "MongoNetworkError" ||
      error.name === "MongoTimeoutError"
    ) {
      return res.status(503).json({
        message: "Database service temporarily unavailable. Please retry shortly.",
        error: error.message,
      });
    }

    return res.status(502).json({
      message: "AI service failed to generate a response",
      error: error.message,
    });
  }
};

export const sendChatsToUser = async (req, res) => {
  try {
    const user = await User.findById(res.locals.jwtData?.id);
    if (!user) {
      return res.status(401).json({ message: "User not registered or token invalid" });
    }
    return res.status(200).json({ message: "OK", chats: user.chats });
  } catch (error) {
    console.error("Error fetching chats:", error);
    if (error.name === "MongooseServerSelectionError" || error.name === "MongoNetworkError") {
      return res.status(503).json({ message: "Database temporarily unavailable" });
    }
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const deleteChats = async (req, res) => {
  try {
    const user = await User.findById(res.locals.jwtData?.id);
    if (!user) {
      return res.status(401).json({ message: "User not registered or token invalid" });
    }
    user.chats = [];
    await user.save();
    return res.status(200).json({ message: "OK" });
  } catch (error) {
    console.error("Error deleting chats:", error);
    if (error.name === "MongooseServerSelectionError" || error.name === "MongoNetworkError") {
      return res.status(503).json({ message: "Database temporarily unavailable" });
    }
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};
