import User from "../models/User.js";
import { hash, compare } from "bcrypt";
import { createToken } from "../libs/jwt-token-generator.js";
import { COOKIE_NAME } from "../libs/constants.js";

const getCookieOptions = (expires) => ({
  path: "/",
  httpOnly: true,
  signed: true,
  sameSite: "lax",
  ...(expires ? { expires } : {}),
});

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    return res.status(200).json({ message: "OK", users });
  } catch (error) {
    console.error("Error getting users:", error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const userSignup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(401).json({ message: "User already registered" });
    }

    const hashedPassword = await hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = createToken(user._id.toString(), user.email, "7d");
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    // Set HTTP-only cookie
    res.cookie(COOKIE_NAME, token, getCookieOptions(expires));

    // Return profile AND token for multi-channel auth (Cookies + Bearer headers)
    return res.status(201).json({
      message: "OK",
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    console.error("Error in userSignup:", error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "User not registered" });
    }

    const isPasswordCorrect = await compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(403).json({ message: "Incorrect Password" });
    }

    const token = createToken(user._id.toString(), user.email, "7d");
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    // Set HTTP-only cookie
    res.cookie(COOKIE_NAME, token, getCookieOptions(expires));

    // Return profile AND token for multi-channel auth (Cookies + Bearer headers)
    return res.status(200).json({
      message: "OK",
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    console.error("Error in userLogin:", error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const verifyUser = async (req, res) => {
  try {
    const user = await User.findById(res.locals.jwtData?.id);
    if (!user) {
      return res.status(401).json({ message: "User not registered or token invalid" });
    }
    if (user._id.toString() !== res.locals.jwtData?.id) {
      return res.status(401).json({ message: "Permissions do not match" });
    }
    return res.status(200).json({
      message: "OK",
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error("Error in verifyUser:", error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const userLogout = async (req, res) => {
  try {
    res.clearCookie(COOKIE_NAME, getCookieOptions());
    return res.status(200).json({
      message: "OK",
    });
  } catch (error) {
    console.error("Error in userLogout:", error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};
