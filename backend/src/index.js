import app from "./app.js";
import { connectToMongoDB, disconnectFromMongoDB } from "./db_connection/mogodbConnection.js";
import dotenv from "dotenv";

dotenv.config();

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception in backend process:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection in backend process:", reason);
});

const PORT = process.env.PORT || 5000;

connectToMongoDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT} & connected to database 🚀`);
    });

    const shutdown = async () => {
      console.log("Shutting down gracefully...");
      server.close(async () => {
        await disconnectFromMongoDB();
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  })
  .catch((err) => {
    console.error("Database connection startup error:", err);
  });
