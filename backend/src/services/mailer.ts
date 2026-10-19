import nodemailer from 'nodemailer';

/**
 * Gmail mailer (P3) — SMTP delivery via a Google Workspace or Gmail account
 * with an App Password. Used for: phone-OTP backup emails, password reset
 * links, security alerts (lockout, password change, 2FA changes), and
 * general transactional mail via notify().
 *
 * Env:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=465
 *   SMTP_USER=hello@yourdomain.com (or you@gmail.com)
 *   SMTP_PASS=your-16-char-google-app-password   (Google Account → Security → 2-Step Verification → App passwords)
 *   MAIL_FROM="Rally <hello@yourdomain.com>"
 *
 * Dev without credentials: emails are logged to the console instead.
 */

let cachedTransport: nodemailer.Transporter | null = null;

export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransport(): nodemailer.Transporter {
  if (cachedTransport) return cachedTransport;
  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: (Number(process.env.SMTP_PORT) || 465) === 465, // true for 465, false for 587+STARTTLS
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
  });
  return cachedTransport;
}

export function fromAddress(): string {
  return process.env.MAIL_FROM || ('Rally <' + (process.env.SMTP_USER || 'no-reply@rally.app') + '>');
}

/** Escapes user content for the simple HTML emails we send. */
function esc(t: string): string {
  return t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

function wrap(inner: string, footer?: string): string {
  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1f2937">' +
    '<div style="font-weight:800;font-size:20px;color:#0ea5e9;margin-bottom:16px">Rally</div>' +
    inner +
    (footer
      ? '<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />' +
        '<p style="font-size:12px;color:#6b7280">' + esc(footer) + '</p>'
      : '') +
    '<p style="font-size:11px;color:#9ca3af;margin-top:16px">Rally never asks for your password, a verification code, or a Gift in a message.</p>' +
    '</div>'
  );
}

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  category?: string; // e.g. 'otp', 'password-reset', 'security'
};

/** Sends one email via Gmail SMTP. Logs in dev; never throws (returns { ok, error }). */
export async function sendMail(input: SendMailInput): Promise<{ ok: boolean; error?: string }> {
  if (!mailConfigured()) {
    console.log('[email:dev]', input.category || 'mail', '→', input.to, '|', input.subject);
    console.log('[email:dev-body]', (input.text || input.html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 400));
    return { ok: true };
  }
  try {
    await getTransport().sendMail({
      from: fromAddress(),
      to: input.to,
      subject: input.subject,
      text: input.text || input.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      html: input.html,
    });
    return { ok: true };
  } catch (e: any) {
    console.error('mail_send_failed', input.category, e?.message);
    return { ok: false, error: e?.message || 'send failed' };
  }
}

// ── Templates ──────────────────────────────────────────────────────────────

export function otpEmail(displayName: string, code: string, ttlMinutes: number): string {
  return wrap(
    '<h2 style="font-size:17px;margin:0 0 12px">Hi ' + esc(displayName) + ',</h2>' +
    '<p style="margin:0 0 16px">Use this verification code:</p>' +
    '<div style="font-size:30px;font-weight:800;letter-spacing:6px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:14px 20px;display:inline-block">' + esc(code) + '</div>' +
    '<p style="margin:16px 0 0">It expires in ' + ttlMinutes + ' minutes. If you did not request it, ignore this email — nothing changes.</p>',
    'You received this because a verification code was requested for your Rally account.'
  );
}

export function passwordResetEmail(displayName: string, resetUrl: string, ttlMinutes: number): string {
  return wrap(
    '<h2 style="font-size:17px;margin:0 0 12px">Hi ' + esc(displayName) + ',</h2>' +
    '<p style="margin:0 0 16px">A password reset was requested for your Rally account.</p>' +
    '<p style="margin:0 0 16px"><a href="' + esc(resetUrl) + '" style="background:#0ea5e9;color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">Choose a new password</a></p>' +
    '<p style="margin:0">Or paste this link into your browser:<br/><span style="font-size:12px;word-break:break-all">' + esc(resetUrl) + '</span></p>' +
    '<p style="margin:16px 0 0">The link is single-use and expires in ' + ttlMinutes + ' minutes. If you did not request this, ignore this email — your password stays unchanged.</p>',
    'Rally will NEVER ask for your password or a code in a message. If someone asks, it is phishing — report them in the app.'
  );
}

export function securityAlertEmail(displayName: string, title: string, detail: string): string {
  return wrap(
    '<h2 style="font-size:17px;margin:0 0 12px">Hi ' + esc(displayName) + ',</h2>' +
    '<p style="margin:0 0 12px"><strong>' + esc(title) + '</strong></p>' +
    '<p style="margin:0 0 16px">' + esc(detail) + '</p>',
    'If this was not you: change your password immediately, sign out all sessions in Settings → Security, and enable two-factor authentication.'
  );
}
