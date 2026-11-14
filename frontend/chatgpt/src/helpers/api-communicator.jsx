import axios from "axios";

export const loginUser = async (email, password) => {
  try {
    const res = await axios.post("/user/login", { email, password });
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      (typeof error.response?.data === "string" ? error.response?.data : null) ||
      error.message ||
      "Unable to login";
    throw new Error(message);
  }
};

export const signupUser = async (name, email, password) => {
  try {
    const res = await axios.post("/user/signup", { name, email, password });
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      (typeof error.response?.data === "string" ? error.response?.data : null) ||
      error.message ||
      "Unable to sign up";
    throw new Error(message);
  }
};

export const checkAuthStatus = async () => {
  try {
    const res = await axios.get("/user/auth-status");
    return res.data;
  } catch (error) {
    return null;
  }
};

// =========================================================================
// CONVERSATIONS API
// =========================================================================

export const getConversations = async () => {
  try {
    const res = await axios.get("/chat/conversations");
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to fetch conversations";
    throw new Error(message);
  }
};

export const getConversation = async (id) => {
  try {
    const res = await axios.get(`/chat/conversation/${id}`);
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to load conversation";
    throw new Error(message);
  }
};

export const createConversation = async (title = "New Chat") => {
  try {
    const res = await axios.post("/chat/conversations", { title });
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to create conversation";
    throw new Error(message);
  }
};

export const renameConversation = async (id, title) => {
  try {
    const res = await axios.put(`/chat/conversation/${id}`, { title });
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to rename conversation";
    throw new Error(message);
  }
};

export const deleteConversation = async (id) => {
  try {
    const res = await axios.delete(`/chat/conversation/${id}`);
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to delete conversation";
    throw new Error(message);
  }
};

// =========================================================================
// CHAT MESSAGES API
// =========================================================================

export const sendChatRequest = async (message, conversationId = null) => {
  try {
    const payload = { message };
    if (conversationId) {
      payload.conversationId = conversationId;
    }
    const res = await axios.post("/chat/new", payload);
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Unable to send chat request";
    throw new Error(message);
  }
};

export const getUserChats = async (conversationId = null) => {
  try {
    const url = conversationId
      ? `/chat/all-chats?conversationId=${encodeURIComponent(conversationId)}`
      : "/chat/all-chats";
    const res = await axios.get(url);
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to retrieve chats";
    throw new Error(message);
  }
};

export const deleteUserChats = async (conversationId = null) => {
  try {
    const url = conversationId
      ? `/chat/delete?conversationId=${encodeURIComponent(conversationId)}`
      : "/chat/delete";
    const res = await axios.delete(url);
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to delete chats";
    throw new Error(message);
  }
};

export const logoutUser = async () => {
  try {
    const res = await axios.get("/user/logout");
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to logout";
    throw new Error(message);
  }
};
