import mongoose from "mongoose";
require("dotenv").config();
const mongoURL = process.env.MONGO_URL;

mongoose.connect(mongoURL, {
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", console.log("MongoDB connection error"));
db.once("open", () => {
  console.log("Connected to DB");
});

export { mongoose, db };
