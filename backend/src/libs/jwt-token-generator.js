import jwt from "jsonwebtoken";
import { COOKIE_NAME } from "./constants.js";

export const createToken = (id, email, expiresIn = "7d") => {
  const payload = { id, email };
  const token = jwt.sign(payload, process.env.JWT_SECRET || "default_jwt_secret", {
    expiresIn,
  });
  return token;
};

export const verifyToken = (req, res, next) => {
  let token = null;

  // 1. Check Authorization Bearer header (primary & standard for cross-origin / mobile / API)
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && typeof authHeader === "string") {
    if (authHeader.startsWith("Bearer ") || authHeader.startsWith("bearer ")) {
      token = authHeader.slice(7).trim();
    } else {
      token = authHeader.trim();
    }
  }

  // 2. Check signed cookies (cookie-parser signed cookies)
  if (!token && req.signedCookies && req.signedCookies[COOKIE_NAME]) {
    token = req.signedCookies[COOKIE_NAME];
  }

  // 3. Check regular/unsigned cookies (cookie-parser fallback)
  if (!token && req.cookies && req.cookies[COOKIE_NAME]) {
    const raw = req.cookies[COOKIE_NAME];
    if (typeof raw === "string") {
      // If signed cookie format s:jwt.signature was not automatically unsigned
      if (raw.startsWith("s:")) {
        const lastDot = raw.lastIndexOf(".");
        token = lastDot > 2 ? raw.slice(2, lastDot) : raw.slice(2);
      } else {
        token = raw;
      }
    }
  }

  // 4. Check x-access-token custom header
  if (!token && req.headers["x-access-token"]) {
    token = req.headers["x-access-token"];
  }

  // If no token is provided anywhere, reject
  if (!token || typeof token !== "string" || token.trim() === "") {
    return res.status(401).json({ message: "Token Not Received" });
  }

  return jwt.verify(
    token.trim(),
    process.env.JWT_SECRET || "default_jwt_secret",
    (err, success) => {
      if (err) {
        return res.status(401).json({ message: "Token Expired or Invalid" });
      }
      res.locals.jwtData = success;
      return next();
    }
  );
};
