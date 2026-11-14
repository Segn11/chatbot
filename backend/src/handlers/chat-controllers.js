import dotenv from "dotenv";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";

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

// =========================================================================
// CONVERSATIONS MANAGEMENT (ChatGPT Multi-Session History)
// =========================================================================

/**
 * Fetch all conversations for the authenticated user (sorted newest first)
 */
export const getUserConversations = async (req, res) => {
  try {
    const userId = res.locals.jwtData?.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "User not registered or token invalid" });
    }

    let conversations = await Conversation.find({ user: userId })
      .sort({ updatedAt: -1 })
      .lean();

    // Lazy migration: if user has legacy chats in user.chats and 0 Conversation documents
    if (conversations.length === 0 && user.chats && user.chats.length > 0) {
      const firstUserMsg = user.chats.find((c) => c.role === "user");
      const title = firstUserMsg
        ? firstUserMsg.content.slice(0, 32).trim() + (firstUserMsg.content.length > 32 ? "..." : "")
        : "Previous Conversation";

      const migrated = await Conversation.create({
        user: userId,
        title,
        messages: user.chats.map((c) => ({
          role: c.role,
          content: c.content,
        })),
      });
      conversations = [migrated.toObject()];
    }

    const summary = conversations.map((c) => ({
      _id: c._id,
      title: c.title || "New Chat",
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messageCount: c.messages?.length || 0,
      lastMessage:
        c.messages?.length > 0
          ? c.messages[c.messages.length - 1].content.slice(0, 60)
          : "",
    }));

    return res.status(200).json({ message: "OK", conversations: summary });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    if (error.name === "MongooseServerSelectionError" || error.name === "MongoNetworkError") {
      return res.status(503).json({ message: "Database temporarily unavailable" });
    }
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

/**
 * Get full conversation details and all its messages
 */
export const getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = res.locals.jwtData?.id;

    const conversation = await Conversation.findOne({ _id: id, user: userId });
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found or access denied" });
    }

    return res.status(200).json({
      message: "OK",
      conversation: {
        _id: conversation._id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
      chats: conversation.messages,
    });
  } catch (error) {
    console.error("Error fetching conversation by id:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Invalid conversation ID" });
    }
    if (error.name === "MongooseServerSelectionError" || error.name === "MongoNetworkError") {
      return res.status(503).json({ message: "Database temporarily unavailable" });
    }
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

/**
 * Create a new conversation session
 */
export const createConversation = async (req, res) => {
  try {
    const userId = res.locals.jwtData?.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "User not registered or token invalid" });
    }

    const { title } = req.body;
    const conversation = await Conversation.create({
      user: userId,
      title: title?.trim() || "New Chat",
      messages: [],
    });

    return res.status(201).json({
      message: "OK",
      conversation: {
        _id: conversation._id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messages: conversation.messages,
      },
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

/**
 * Rename a conversation title
 */
export const renameConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = res.locals.jwtData?.id;
    const { title } = req.body;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: id, user: userId },
      { title: title.trim() },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found or access denied" });
    }

    return res.status(200).json({
      message: "OK",
      conversation: {
        _id: conversation._id,
        title: conversation.title,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error renaming conversation:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Invalid conversation ID" });
    }
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

/**
 * Delete a specific conversation session
 */
export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = res.locals.jwtData?.id;

    const conversation = await Conversation.findOneAndDelete({ _id: id, user: userId });
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found or access denied" });
    }

    return res.status(200).json({ message: "OK", deletedId: id });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Invalid conversation ID" });
    }
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

// =========================================================================
// CHAT COMPLETION & BACKWARD COMPATIBILITY
// =========================================================================

/**
 * Generate AI completion within an active or newly created conversation
 */
export const generateChatCompletion = async (req, res) => {
  try {
    const { message, conversationId, isNew } = req.body;
    const userId = res.locals.jwtData?.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ message: "User not registered or token invalid" });
    }

    let conversation = null;

    if (conversationId && conversationId !== "new") {
      conversation = await Conversation.findOne({ _id: conversationId, user: userId });
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found or access denied" });
      }
    } else if (isNew === true || conversationId === "new") {
      const derivedTitle =
        message.length > 32 ? message.slice(0, 32).trim() + "..." : message.trim();
      conversation = new Conversation({
        user: userId,
        title: derivedTitle || "New Chat",
        messages: [],
      });
    } else {
      // Default / automated test runner: continue user's latest conversation, or create one
      conversation = await Conversation.findOne({ user: userId }).sort({ updatedAt: -1 });
      if (!conversation) {
        const derivedTitle =
          message.length > 32 ? message.slice(0, 32).trim() + "..." : message.trim();
        conversation = new Conversation({
          user: userId,
          title: derivedTitle || "New Chat",
          messages: [],
        });
      }
    }

    // Build chat history for AI from this conversation's messages
    const chats = conversation.messages.map(({ role, content }) => ({
      role,
      content,
    }));
    chats.push({ role: "user", content: message });

    // Generate AI response
    const aiMessage = await getAIResponse(chats, message);

    // Save turn to conversation
    conversation.messages.push({ role: "user", content: message });
    conversation.messages.push({ role: "assistant", content: aiMessage });

    // Auto-title on first turn if generic
    if (conversation.title === "New Chat" && conversation.messages.length <= 2) {
      conversation.title =
        message.length > 32 ? message.slice(0, 32).trim() + "..." : message.trim();
    }

    await conversation.save();

    // Sync user.chats for legacy queries & tests
    user.chats.push({ role: "user", content: message });
    user.chats.push({ role: "assistant", content: aiMessage });
    await user.save();

    return res.status(200).json({
      message: "OK",
      chats: conversation.messages,
      conversationId: conversation._id,
      conversation: {
        _id: conversation._id,
        title: conversation.title,
        updatedAt: conversation.updatedAt,
      },
    });
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

/**
 * Send chats to user: returns chats from a specified conversation or latest session
 */
export const sendChatsToUser = async (req, res) => {
  try {
    const userId = res.locals.jwtData?.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "User not registered or token invalid" });
    }

    const { conversationId } = req.query;

    if (conversationId) {
      const conv = await Conversation.findOne({ _id: conversationId, user: userId });
      return res.status(200).json({
        message: "OK",
        chats: conv ? conv.messages : [],
        conversationId: conv?._id,
        title: conv?.title,
      });
    }

    // Default: find latest conversation, or fallback to user.chats
    const latestConv = await Conversation.findOne({ user: userId }).sort({ updatedAt: -1 });
    if (latestConv) {
      return res.status(200).json({
        message: "OK",
        chats: latestConv.messages,
        conversationId: latestConv._id,
        title: latestConv.title,
      });
    }

    return res.status(200).json({ message: "OK", chats: user.chats || [] });
  } catch (error) {
    console.error("Error fetching chats:", error);
    if (error.name === "MongooseServerSelectionError" || error.name === "MongoNetworkError") {
      return res.status(503).json({ message: "Database temporarily unavailable" });
    }
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

/**
 * Delete chats: deletes a single conversation if conversationId is given, or all user conversations
 */
export const deleteChats = async (req, res) => {
  try {
    const userId = res.locals.jwtData?.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "User not registered or token invalid" });
    }

    const { conversationId } = req.query;

    if (conversationId) {
      await Conversation.findOneAndDelete({ _id: conversationId, user: userId });
      return res.status(200).json({ message: "OK", deletedId: conversationId });
    }

    // Delete all conversations for this user
    await Conversation.deleteMany({ user: userId });
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
