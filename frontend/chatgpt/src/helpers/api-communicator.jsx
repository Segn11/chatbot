import axios from "axios";


export const loginUser = async (email, password) => {
  try {
    const res = await axios.post("/user/login", { email, password });
    if (res.status !== 200) {
      throw new Error("Unable to login");
    }
    const data = await res.data;
    return data;
  } catch (error) {
    console.log("this error from login")
    console.log(error.message)
  }
};

export const signupUser = async (name, email, password) => {
  try {
    const res = await axios.post("/user/signup", { name, email, password });
    if (res.status !== 201) {
      throw new Error("Unable to Signup");
    }
    const data = await res.data;
    return data;
  } catch (error) {
    console.log(error.message)
  }
};

export const checkAuthStatus = async () => {
  try {
    const res = await axios.get("/user/auth-status");
    if (res.status !== 200) {
      throw new Error("Unable to authenticate");
    }
    const data = await res.data;
    return data;

  } catch (error) {
    console.log("Error in checkAuthStatus")
    console.log(error.message)
  }

};

export const sendChatRequest = async (message) => {
  try {
    const res = await axios.post("/chat/new", { message });
    if (res.status !== 200) {
      throw new Error("Unable to send chat");
    }
    const data = await res.data;
    return data;
  } catch (error) {
    console.log("this is error from sendchat request")
    console.log(error.message)
  }
};

export const getUserChats = async () => {
  try {
    const res = await axios.get("/chat/all-chats");
    if (res.status !== 200) {
      throw new Error("Unable to send chat");
    }
    const data = await res.data;
    return data;

  } catch (error) {
    console.log(error.message)
  }
}

export const deleteUserChats = async () => {
  try {
    const res = await axios.delete("/chat/delete");
    if (res.status !== 200) {
      throw new Error("Unable to delete chats");
    }
    const data = await res.data;
    return data;
  } catch (error) {
    console.log(error.message)
  }
};

export const logoutUser = async () => {
  try {
    const res = await axios.get("/user/logout");
    if (res.status !== 200) {
      throw new Error("Unable to delete chats");
    }
    const data = await res.data;
    return data;
  } catch (error) {
    console.log(error.messsage)
  }
};