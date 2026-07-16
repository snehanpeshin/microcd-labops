import { Resend } from "resend";
import type { EmailContent } from "./templates";

export async function sendTransactionalEmail(to: string, content: EmailContent) {
  if (!process.env.RESEND_API_KEY) {
    if (process.env.EMAIL_PREVIEW_MODE === "true") return { id: "preview", preview: { to, ...content } };
    throw new Error("Email delivery is not configured");
  }
  const result = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: process.env.RESEND_FROM_EMAIL ?? "MicroCD LabOps Beta <notifications@example.com>", to, subject: content.subject, html: content.html, text: content.text });
  if (result.error) throw new Error("Email delivery failed");
  return { id: result.data?.id ?? "unknown" };
}
