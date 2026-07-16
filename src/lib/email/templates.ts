const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);

export interface EmailContent { subject: string; html: string; text: string }

export function invitationEmail(input: { organizationName: string; inviterName: string; role: string; url: string; expiresAt: string }): EmailContent {
  const subject = `Invitation to ${input.organizationName} in MicroCD LabOps Beta`;
  const text = `${input.inviterName} invited you to ${input.organizationName} as ${input.role}. Accept before ${input.expiresAt}: ${input.url}\n\nIf you were not expecting this invitation, ignore this message.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#172033"><p style="font-size:12px;font-weight:700;color:#0f766e">MICROCD LABOPS BETA</p><h1 style="font-size:24px">Join ${escapeHtml(input.organizationName)}</h1><p>${escapeHtml(input.inviterName)} invited you as <strong>${escapeHtml(input.role)}</strong>.</p><p><a href="${escapeHtml(input.url)}" style="display:inline-block;background:#0f766e;color:white;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:700">Review invitation</a></p><p style="font-size:13px;color:#64748b">Expires ${escapeHtml(input.expiresAt)}. If you were not expecting this invitation, ignore this message.</p></div>`;
  return { subject, html, text };
}
