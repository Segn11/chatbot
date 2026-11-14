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

export const sendChatRequest = async (message) => {
  try {
    const res = await axios.post("/chat/new", { message });
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

export const getUserChats = async () => {
  try {
    const res = await axios.get("/chat/all-chats");
    return res.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to retrieve chats";
    throw new Error(message);
  }
};

export const deleteUserChats = async () => {
  try {
    const res = await axios.delete("/chat/delete");
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
