type LeadConfirmationInput = {
  name: string;
  organization: string;
  message: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

export function buildLeadConfirmation(input: LeadConfirmationInput) {
  const organization = input.organization.trim() || "Not provided";
  const subject = "We received your MicroCD LabOps pilot request";
  const text = `Hello ${input.name},

Thank you for contacting MicroCD Labs. We received your request to discuss a MicroCD LabOps pilot and will review the workflow before replying by email.

Organization: ${organization}

Workflow to document or trace:
${input.message}

Please do not reply with confidential, patient, regulated, or export-controlled information until an appropriate agreement and data-handling approach are in place.

MicroCD Labs
info@microcdlabs.com
https://www.microcdlabs.com`;

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f4f6f8;color:#17202c;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:620px;margin:0 auto;padding:28px 16px;">
      <div style="background:#111923;border-radius:8px 8px 0 0;padding:18px 22px;color:#fff;font-size:20px;font-weight:600;">MicroCD Labs</div>
      <div style="border:1px solid #d8e0e7;border-top:0;border-radius:0 0 8px 8px;background:#fff;padding:28px 22px;">
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hello ${escapeHtml(input.name)},</p>
        <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;color:#17202c;">Your LabOps pilot request was received.</h1>
        <p style="margin:0 0 22px;color:#5f6b79;font-size:15px;line-height:1.65;">Thank you for contacting MicroCD Labs. We will review the workflow and reply by email.</p>
        <div style="border-left:4px solid #126b64;background:#edf4f2;padding:16px 18px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;color:#0d514c;">Organization</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">${escapeHtml(organization)}</p>
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;color:#0d514c;">Workflow to document or trace</p>
          <p style="margin:0;white-space:pre-wrap;font-size:15px;line-height:1.6;">${escapeHtml(input.message)}</p>
        </div>
        <p style="margin:22px 0 0;color:#5f6b79;font-size:12px;line-height:1.6;">Please do not reply with confidential, patient, regulated, or export-controlled information until an appropriate agreement and data-handling approach are in place.</p>
      </div>
      <p style="margin:16px 0 0;text-align:center;color:#5f6b79;font-size:12px;">MicroCD Labs · <a href="mailto:info@microcdlabs.com" style="color:#0d514c;">info@microcdlabs.com</a> · <a href="https://www.microcdlabs.com" style="color:#0d514c;">microcdlabs.com</a></p>
    </div>
  </body>
</html>`;

  return { subject, text, html };
}
