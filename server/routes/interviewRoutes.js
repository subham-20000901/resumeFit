import express from "express";
import { authUser } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/fileMiddleware.js";
import {
  generateInterviewReportController,
  generateResumePdfController,
  getAllInterviewReportsController,
  getInterviewReportByIdController,
} from "../controller/interviewController.js";

const interviewRouter = express.Router();

interviewRouter.post(
  "/",
  authUser,
  upload.single("resume"),
  generateInterviewReportController,
);

interviewRouter.get(
  "/report/:interviewId",
  authUser,
  getInterviewReportByIdController,
);

interviewRouter.get("/", authUser, getAllInterviewReportsController);

interviewRouter.post(
  "/resume/pdf/:interviewReportId",
  authUser,
  generateResumePdfController,
);
export default interviewRouter;
