import {
  generateInterviewReport,
  generateResumePdf,
  getAllInterviewReports,
  getInterviewReportById,
} from "../services/interview.api";
import { useContext } from "react";
import { InterviewContext } from "../interview.context";
import { useParams } from "react-router";
import { useEffect } from "react";

export const useInterview = () => {
  const context = useContext(InterviewContext);
  const { interviewId } = useParams();

  if (!context) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }

  const { loading, setLoading, report, setReport, reports, setReports } =
    context;

 const generateReport = async ({
    jobDescription,
    selfDescription,
    resumeFile
}) => {
    setLoading(true);

    try {
        const response = await generateInterviewReport({
            jobDescription,
            selfDescription,
            resumeFile
        });

        console.log("GENERATE REPORT RESPONSE:", response);

        const interviewReport = response?.interviewReport || null;

        setReport(interviewReport);

        return interviewReport;
    } catch (error) {
        console.error("GENERATE REPORT ERROR:", error);

        setReport(null);

        return null;
    } finally {
        setLoading(false);
    }
};

  const getReportById = async (interviewId) => {
    setLoading(true);
    let response = null;
    try {
      response = await getInterviewReportById(interviewId);
      setReport(response.interviewReport);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
    return response.interviewReport;
  };
  const getReports = async () => {
    setLoading(true);

    try {
        const response = await getAllInterviewReports();

        console.log("GET REPORTS RESPONSE:", response);
        console.log("INTERVIEW REPORTS:", response?.interviewReports);

        setReports(response?.interviewReports || []);

        return response?.interviewReports || [];
    } catch (error) {
        console.error("GET REPORTS ERROR:", error);
        setReports([]);
        return [];
    } finally {
        setLoading(false);
    }
};

  const getResumePdf = async (interviewReportId) => {
    setLoading(true);
    let response = null;
    try {
      response = await generateResumePdf({ interviewReportId });
      const url = window.URL.createObjectURL(
        new Blob([response], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `resume_${interviewReportId}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (interviewId) {
      getReportById(interviewId);
    } else {
      getReports();
    }
  }, [interviewId]);

  return {
    loading,
    report,
    reports,
    generateReport,
    getReportById,
    getReports,
    getResumePdf,
  };
};
