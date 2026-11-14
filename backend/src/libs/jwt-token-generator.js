import jwt from "jsonwebtoken";
import { COOKIE_NAME } from "./constants.js";

export const createToken = (id, email, expiresIn) => {
  const payload = { id, email };
  const token = jwt.sign(payload, process.env.JWT_SECRET || "default_jwt_secret", {
    expiresIn,
  });
  return token;
};

export const verifyToken = (req, res, next) => {
  const token = req.signedCookies[`${COOKIE_NAME}`];
  if (!token || token.trim() === "") {
    return res.status(401).json({ message: "Token Not Received" });
  }

  return jwt.verify(
    token,
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
