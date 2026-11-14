import rateLimit from "express-rate-limit";

// Allow test runner to bypass rate limits when stress testing from a single IP
const isTestBypass = (req) => req.headers["x-test-bypass-ratelimit"] === "true";

// General API Rate Limiter
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  skip: isTestBypass,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests from this IP, please try again in a minute.",
  },
});

// Auth Endpoints Rate Limiter (Brute-Force Protection)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 minutes
  skip: isTestBypass,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login/signup attempts from this IP, please try again in 15 minutes.",
  },
});

// Chat Endpoints Rate Limiter (AI Quota & Cost Protection)
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 AI prompts per minute
  skip: isTestBypass,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "You have exceeded the AI message rate limit. Please wait a moment before sending more messages.",
  },
});
