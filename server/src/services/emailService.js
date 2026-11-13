import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter;
/** In-memory log of the last emails (handy for tests and local development). */
export const sentEmails = [];

function getTransporter() {
  if (transporter) return transporter;
  if (env.smtp.host) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  } else {
    // No SMTP configured: build the message but don't send it — it is logged to the console instead.
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

/**
 * Send an email. Never throws — a mail outage must not break a booking or an order.
 * @returns {Promise<boolean>} whether the message was handed to the transport
 */
export async function sendEmail({ to, subject, html, text, replyTo }) {
  if (!to) return false;
  if (!env.smtp.host && env.isProd) {
    // Live site without an email service: never write message bodies (they can contain
    // password-reset links) to the server logs. Just flag that email isn't configured.
    console.warn(`[email] SMTP is not configured — "${subject}" was NOT sent. Set SMTP_* environment variables.`);
    return false;
  }
  try {
    await getTransporter().sendMail({ from: env.emailFrom, to, subject, html, text, replyTo });
    sentEmails.push({ to, subject, at: new Date() });
    if (sentEmails.length > 50) sentEmails.shift();
    if (!env.smtp.host && !env.isTest) {
      console.log(`\n[email:dev] To: ${to}\n[email:dev] Subject: ${subject}\n[email:dev] ${(text || '').slice(0, 600)}\n`);
    }
    return true;
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err.message);
    return false;
  }
}

export function notifyOwner(subject, html, text) {
  if (!env.notifyEmail) return Promise.resolve(false);
  return sendEmail({ to: env.notifyEmail, subject, html, text });
}
