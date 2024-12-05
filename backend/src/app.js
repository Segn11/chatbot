import express from "express";
import { config } from "dotenv";
// import dotenv from 'dotenv';
import appRouter from "./routes/index.js";
import cookieParser from "cookie-parser";
import cors from "cors";
config();
const app = express();

//middlewares


import * as dotenv from 'dotenv';
dotenv.config();

const corsOptions = {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

//remove it in production
// app.use(morgan("dev"));

app.use("/api/v1", appRouter);

export default app;