import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./routes/authRoutes.js";
import interviewRouter from "./routes/interviewRoutes.js";

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "https://jazzy-unicorn-ce16bf.netlify.app",
    credentials: true,
  }),
);
app.use("/api/auth", authRouter);
app.use("/api/interview",interviewRouter);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => console.log(`Server Started At PORT: ${PORT}`));
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
  });


