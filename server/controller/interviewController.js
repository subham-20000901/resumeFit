import InterviewReport from "../model/interviewReportModel.js";
import { PDFParse } from "pdf-parse";
import generateInterviewReport, { generateResumePdf } from "../services/ai.service.js";

export const generateInterviewReportController = async (req, res) => {
  const parser = new PDFParse({
    data: req.file.buffer,
  });

  const resumeContent = await parser.getText();
  const { selfDescription, jobDescription } = req.body;

  const interviewReportByAi = await generateInterviewReport({
    resume: resumeContent.text,
    selfDescription,
    jobDescription,
  });

  const interviewReport = await InterviewReport.create({
    user: req.user.id,
    resume: resumeContent.text,
    selfDescription,
    jobDescription,
    ...interviewReportByAi,
  });

  console.log();

  return res.status(201).json({
    success: true,
    message: "Interview report guranted successfully",
    interviewReport,
  });
};

export const getInterviewReportByIdController = async (req, res) => {
    const { interviewId } = req.params

    const interviewReport = await InterviewReport.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
};

export const getAllInterviewReportsController = async (req, res) => {
  const interviewReports = await InterviewReport.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .select(
      "-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan",
    );

    return res.status(200).json({
      success:true,
      message:"Interview reports fetched successfully.",
      interviewReports
    })
};

export const generateResumePdfController = async (req, res) => {
   const { interviewReportId } = req.params

    const interviewReport = await InterviewReport.findById(interviewReportId)

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
};
