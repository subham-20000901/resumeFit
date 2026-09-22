import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .describe(
      "A score between 0 and 100 indicating how well the candidate's profile matches the job description"
    ),

  technicalQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe(
            "The technical question that can be asked in the interview"
          ),

        intention: z
          .string()
          .describe(
            "The intention of the interviewer behind asking this question"
          ),

        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take etc."
          ),
      })
    )
    .describe(
      "Technical questions that can be asked in the interview along with their intention and how to answer them"
    ),

  behavioralQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe(
            "The behavioral question that can be asked in the interview"
          ),

        intention: z
          .string()
          .describe(
            "The intention of the interviewer behind asking this question"
          ),

        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take etc."
          ),
      })
    )
    .describe(
      "Behavioral questions that can be asked in the interview along with their intention and how to answer them"
    ),

  skillGaps: z
    .array(
      z.object({
        skill: z
          .string()
          .describe("The skill which the candidate is lacking"),

        severity: z
          .enum(["low", "medium", "high"])
          .describe(
            "The severity of this skill gap, i.e. how important this skill is for the job and how much it can impact the candidate's chances"
          ),
      })
    )
    .describe(
      "List of skill gaps in the candidate's profile along with their severity"
    ),

  preparationPlan: z
    .array(
      z.object({
        day: z
          .number()
          .describe(
            "The day number in the preparation plan, starting from 1"
          ),

        focus: z
          .string()
          .describe(
            "The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."
          ),

        tasks: z
          .array(z.string())
          .describe(
            "List of tasks to be done on this day to follow the preparation plan"
          ),
      })
    )
    .describe(
      "A day-wise preparation plan for the candidate to follow to prepare for the interview effectively"
    ),

  title: z
    .string()
    .describe(
      "The title of the job for which the interview report is generated"
    ),
});


// ======================================================
// GENERATE INTERVIEW REPORT
// ======================================================

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const prompt = `Generate an interview report for a candidate with the following details:

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}

Generate a detailed interview preparation report based on the candidate's resume, self-description, and job description.
`;

  const schema = zodToJsonSchema(interviewReportSchema);

  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Gemini attempt ${attempt}/${maxRetries}`);

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",

        contents: prompt,

        config: {
          responseMimeType: "application/json",

          responseSchema: schema,
        },
      });

      console.log("Gemini response received");

      return JSON.parse(response.text);
    } catch (error) {
      console.error(
        `Gemini attempt ${attempt} failed:`,
        error.message
      );

      const is503 =
        error?.status === 503 ||
        error?.code === 503 ||
        error?.message?.includes("503") ||
        error?.message?.includes("high demand") ||
        error?.message?.includes("UNAVAILABLE");

      // If this isn't a temporary 503 error,
      // don't retry. Throw the error immediately.
      if (!is503) {
        throw error;
      }

      // If we have used all retries, throw the error.
      if (attempt === maxRetries) {
        console.error(
          "Gemini failed after all retry attempts."
        );

        throw error;
      }

      // Wait before retrying.
      const delay = attempt * 2000;

      console.log(
        `Retrying in ${delay / 1000} seconds...`
      );

      await new Promise((resolve) =>
        setTimeout(resolve, delay)
      );
    }
  }
}


// ======================================================
// GENERATE PDF FROM HTML
// ======================================================

async function generatePdfFromHtml(htmlContent) {
  const isProduction = process.env.NODE_ENV === "production";

  const browser = await puppeteer.launch(
    isProduction
      ? {
          args: chromium.args,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
          defaultViewport: chromium.defaultViewport,
        }
      : {
          executablePath:
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          headless: true,
        }
  );

  const page = await browser.newPage();

  await page.setContent(htmlContent, {
    waitUntil: "networkidle0",
  });

  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: {
      top: "20mm",
      bottom: "20mm",
      left: "15mm",
      right: "15mm",
    },
  });

  await browser.close();

  return pdfBuffer;
}


// ======================================================
// GENERATE RESUME PDF
// ======================================================

export async function generateResumePdf({
  resume,
  selfDescription,
  jobDescription,
}) {
  const resumePdfSchema = z.object({
    html: z
      .string()
      .describe(
        "The HTML content of the resume which can be converted to PDF using puppeteer"
      ),
  });

  const prompt = `Generate a professional resume for a candidate with the following details:

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}

The response should be a JSON object with a single field "html" which contains the HTML content of the resume.

The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience.

The HTML content should be well-formatted and structured, making it easy to read and visually appealing.

The content of the resume should not sound like it was generated by AI and should be as close as possible to a real human-written resume.

You can highlight content using colors or different font styles, but the overall design should be simple and professional.

The content should be ATS friendly, meaning it should be easily parsable by ATS systems without losing important information.

The resume should ideally be 1-2 pages long when converted to PDF.

Focus on quality rather than quantity and include relevant information that can help the candidate get an interview call for the given job description.
`;

  const schema = zodToJsonSchema(resumePdfSchema);

  // Try models in this order
  const models = [
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash-lite",
  ];

  let lastError;

  for (const model of models) {
    console.log(`Trying resume generation with ${model}`);

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(
          `Resume PDF Gemini attempt ${attempt}/2 using ${model}`
        );

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        });

        console.log(
          `Resume HTML generated successfully using ${model}`
        );

        const jsonContent = JSON.parse(response.text);

        const pdfBuffer = await generatePdfFromHtml(
          jsonContent.html
        );

        console.log("Resume PDF generated successfully");

        return pdfBuffer;
      } catch (error) {
        lastError = error;

        console.error(
          `Resume PDF attempt ${attempt} failed using ${model}:`,
          error.message
        );

        const is503 =
          error?.status === 503 ||
          error?.code === 503 ||
          error?.message?.includes("503") ||
          error?.message?.includes("high demand") ||
          error?.message?.includes("UNAVAILABLE");

        // If it isn't a capacity problem, stop immediately.
        if (!is503) {
          throw error;
        }

        // Retry the same model once.
        if (attempt < 2) {
          console.log(
            `Retrying ${model} in 2 seconds...`
          );

          await new Promise((resolve) =>
            setTimeout(resolve, 2000)
          );
        }
      }
    }

    console.log(
      `${model} unavailable. Trying next model...`
    );
  }

  console.error(
    "All Gemini models failed for resume generation."
  );

  throw lastError;
}


// ======================================================
// EXPORT
// ======================================================

export default generateInterviewReport;