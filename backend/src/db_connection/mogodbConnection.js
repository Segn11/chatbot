import mongoose from "mongoose";

let mongodInstance = null;

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error event:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected.");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected.");
});

export const connectToMongoDB = async () => {
  if (process.env.MONGODB_URL) {
    try {
      console.log("Connecting to MongoDB from MONGODB_URL...");
      await mongoose.connect(process.env.MONGODB_URL, {
        serverSelectionTimeoutMS: 15000,
      });
      console.log("Connected Successfully to MongoDB");
      return;
    } catch (error) {
      console.warn(
        `Could not connect to external MongoDB (${error.message}). Falling back to in-memory database...`
      );
    }
  }

  try {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    mongodInstance = await MongoMemoryServer.create();
    const uri = mongodInstance.getUri();
    await mongoose.connect(uri);
    console.log("Connected Successfully to In-Memory MongoDB at", uri);
  } catch (memErr) {
    console.error("Failed to connect to in-memory MongoDB:", memErr);
    throw memErr;
  }
};

export const disconnectFromMongoDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (error) {
    console.log("Error disconnecting from MongoDB:", error);
  }
};
