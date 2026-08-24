export type EmailCategory = "APPLICATION_CONFIRMATION" | "INTERVIEW_INVITATION" | "REJECTION" | "OTHER";

export interface ClassifiedEmail {
  category: EmailCategory;
  confidence: number;
  extractedCompanyName?: string;
  extractedJobTitle?: string;
  summary: string;
}

/**
 * Classifies inbound recruiter and application emails.
 */
export function classifyInboundEmail(subject: string, bodyText: string): ClassifiedEmail {
  const combined = `${subject} ${bodyText}`.toLowerCase();

  // 1. Interview Invitation (Highest priority)
  if (
    combined.includes("interview") ||
    combined.includes("schedule a call") ||
    combined.includes("speak with our team") ||
    combined.includes("next round") ||
    combined.includes("phone screen") ||
    combined.includes("technical discussion") ||
    combined.includes("calendly.com")
  ) {
    return {
      category: "INTERVIEW_INVITATION",
      confidence: 0.95,
      summary: "Recruiter invitation to schedule an interview or technical screen.",
    };
  }

  // 2. Rejection
  if (
    combined.includes("unfortunately") ||
    combined.includes("not moving forward") ||
    combined.includes("pursue other candidates") ||
    combined.includes("decided to move forward with another") ||
    combined.includes("position has been filled") ||
    combined.includes("not selected")
  ) {
    return {
      category: "REJECTION",
      confidence: 0.92,
      summary: "Application status update: Not selected for this role.",
    };
  }

  // 3. Application Confirmation
  if (
    combined.includes("thank you for applying") ||
    combined.includes("application received") ||
    combined.includes("received your application") ||
    combined.includes("confirming receipt of your application") ||
    combined.includes("we have received your resume")
  ) {
    return {
      category: "APPLICATION_CONFIRMATION",
      confidence: 0.96,
      summary: "Confirmation that employer received your application submission.",
    };
  }

  return {
    category: "OTHER",
    confidence: 0.5,
    summary: "General job alert or correspondence.",
  };
}