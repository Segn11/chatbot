import { Router } from "express";
import {
  getAllUsers,
  userLogin,
  userLogout,
  userSignup,
  verifyUser,
} from "../handlers/user-handler.js";
import {
  loginValidator,
  signupValidator,
  validate,
} from "../libs/data-validator.js";
import { verifyToken } from "../libs/jwt-token-generator.js";
import { authLimiter } from "../libs/rate-limiter.js";

const userRoutes = Router();

userRoutes.get("/", getAllUsers);
userRoutes.post("/signup", authLimiter, validate(signupValidator), userSignup);
userRoutes.post("/login", authLimiter, validate(loginValidator), userLogin);
userRoutes.get("/auth-status", verifyToken, verifyUser);
userRoutes.get("/logout", userLogout);

export default userRoutes;
