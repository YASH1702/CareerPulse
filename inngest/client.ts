import { Inngest } from "inngest";

// Event types
export type Events = {
  "job/created": {
    data: { jobId: string; userId: string };
  };
  "job/analyze": {
    data: { jobId: string; userId: string; priority?: boolean };
  };
  "application/status-changed": {
    data: { applicationId: string; userId: string; newStatus: string };
  };
  "email/job-alert": {
    data: { userId: string; emailId: string; rawEmail: string };
  };
  "notification/follow-up": {
    data: { applicationId: string; userId: string };
  };
};

export const inngest = new Inngest({
  id: "jobpilot-ai",
  name: "JobPilot AI",
});
