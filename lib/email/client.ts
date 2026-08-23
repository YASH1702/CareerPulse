import { Resend } from "resend";

let resendInstance: Resend | null = null;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "re_your-resend-api-key") {
    return null;
  }

  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }

  return resendInstance;
}