import dotenv from "dotenv";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/User.js";

dotenv.config();

// Helper to get AI response
const getAIResponse = async (chats, message) => {
  // 1. OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
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
      console.warn("OpenAI API call failed:", err.message);
      if (!process.env.GEMINI_API_KEY && !process.env.GROK_API_KEY) {
        throw err;
      }
    }
  }

  // 2. Google Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      });

      // Map chat history for Gemini
      const chatHistory = chats.slice(0, -1).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      const chatSession = model.startChat({
        history: chatHistory,
      });

      const result = await chatSession.sendMessage(message);
      return result.response.text();
    } catch (err) {
      console.warn("Gemini API call failed:", err.message);
      if (!process.env.GROK_API_KEY) {
        throw err;
      }
    }
  }

  // 3. Grok (xAI)
  if (process.env.GROK_API_KEY) {
    try {
      const grokClient = new OpenAI({
        apiKey: process.env.GROK_API_KEY,
        baseURL: "https://api.x.ai/v1",
      });

      const completion = await grokClient.chat.completions.create({
        model: process.env.GROK_MODEL || "grok-2-latest",
        messages: chats,
      });

      if (completion.choices && completion.choices.length > 0) {
        return completion.choices[0].message.content;
      }
    } catch (err) {
      console.warn("Grok API call failed:", err.message);
      throw err;
    }
  }

  // Fallback demo response if no external API key is configured
  return (
    `[Local Demo Mode] Hello! I received your message: "${message}".\n\n` +
    `To enable live AI completions, please add an API key (OPENAI_API_KEY or GEMINI_API_KEY or GROK_API_KEY) to backend/.env.`
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
    user.chats.push({ role: "user", content: message });

    // Generate AI response
    const aiMessage = await getAIResponse(chats, message);

    user.chats.push({ role: "assistant", content: aiMessage });
    await user.save();

    return res.status(200).json({ chats: user.chats });
  } catch (error) {
    console.error("Error generating chat completion:", error);
    return res.status(500).json({
      message: "Something went wrong while generating response",
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
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};
