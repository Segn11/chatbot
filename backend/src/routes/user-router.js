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

const userRoutes = Router();

userRoutes.get("/", getAllUsers);
userRoutes.post("/signup", validate(signupValidator), userSignup);
userRoutes.post("/login", validate(loginValidator), userLogin);
userRoutes.get("/auth-status", verifyToken, verifyUser);
userRoutes.get("/logout", verifyToken, userLogout);

export default userRoutes;