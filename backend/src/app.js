import express from "express";
import dotenv from "dotenv";
import appRouter from "./routes/index.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { globalLimiter } from "./libs/rate-limiter.js";

dotenv.config();
const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:80",
  "http://127.0.0.1:80",
  "http://localhost",
  ...(process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : []),
];

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for local dev & internal docker networking
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-access-token"],
  exposedHeaders: ["Set-Cookie", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" })); // Prevent oversized JSON payload attacks
app.use(cookieParser(process.env.COOKIE_SECRET || "default_cookie_secret_key_123456789"));
app.use(globalLimiter);

// Health check endpoint for Docker / Kubernetes
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.use("/api/v1", appRouter);

export default app;
