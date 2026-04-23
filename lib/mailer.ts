import nodemailer from "nodemailer"
import { Invite } from "./interfaces/invites/invite"

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT ?? 587),
  secure: process.env.EMAIL_PORT === "465",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export async function sendInviteEmail(email: string, invite: Invite) {
  const organisationName = escapeHtml(invite.organisation?.name || "Student organisation")
  const inviterDisplayName = escapeHtml(invite.inviter?.username || invite.inviter?.email || "a Student Council member")
  const inviteLink = `https://dashboard.studentcouncil.dk/invite/${invite.id}`
  const safeInviteLink = escapeHtml(inviteLink)
  const subject = `Invitation to join ${organisationName} on Student Council`

  const text = [
    `You have been invited to join ${invite.organisation?.name || "a student organisation"} on Student Council.`,
    "",
    `Invited by: ${invite.inviter?.username || invite.inviter?.email || "Student Council"}`,
    "",
    "Accept your invitation:",
    inviteLink,
    "",
    "Important:",
    "If you do not already have a Student Council account, create one using the same email address that received this invitation.",
  ].join("\n")

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:8px 0;color:#111827;">
      <h2 style="margin:0 0 12px 0;font-size:24px;line-height:1.3;">Join ${organisationName}</h2>
      <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;"><strong>${inviterDisplayName}</strong> invited you to join <strong>${organisationName}</strong> as a member on the Student Council Dashboard.</p>

      <p style="margin:0 0 20px 0;">
        <a href="${safeInviteLink}" style="display:inline-block;background:#7f1d1d;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 18px;border-radius:8px;">Accept invitation</a>
      </p>

      <p style="margin:0 0 6px 0;font-size:13px;color:#4b5563;">If the button does not work, open this link:</p>
      <p style="margin:0 0 16px 0;font-size:13px;line-height:1.6;word-break:break-all;"><a href="${safeInviteLink}" style="color:#111827;">${safeInviteLink}</a></p>

      <div style="margin:0 0 16px 0;padding:12px;border-radius:8px;background:#f4f4f5;">
        <p style="margin:0;font-size:13px;line-height:1.6;color:#111827;">
          <strong>Important:</strong> If you do not already have a Student Council account, create one with the <strong>same email address</strong> that received this invite.
        </p>
      </div>

      <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">If you did not expect this invitation, you can safely ignore this email.</p>
    </div>
  `

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? "Student Council <noreply@studentcouncil.dk>",
      to: email,
      subject,
      text,
      html,
    })
    console.log("[mailer] Sent invite successfully")
  } catch (error) {
    console.error("[mailer] Failed to send email:", error)
    throw error
  }
}