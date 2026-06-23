import nodemailer from 'nodemailer';

// Support either custom SMTP (SMTP_HOST/SMTP_USER/SMTP_PASS) or SendGrid API key (SENDGRID_API_KEY)
const hasCustomSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const hasSendgrid = Boolean(process.env.SENDGRID_API_KEY);

let transporter = null;
let provider = null;

if (hasCustomSmtp) {
  provider = 'smtp';
  const smtpOptions = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: (process.env.SMTP_SECURE === 'true') || Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    pool: process.env.SMTP_POOL === 'true' || true,
    maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS || 5),
    maxMessages: Number(process.env.SMTP_MAX_MESSAGES || Infinity),
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 10000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 5000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 20000),
  };
  transporter = nodemailer.createTransport(smtpOptions);
} else if (hasSendgrid) {
  provider = 'sendgrid';
  // Use SendGrid SMTP relay via smtp.sendgrid.net; user is 'apikey' and pass is the API key
  const sendgridOptions = {
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY,
    },
    pool: true,
    maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS || 5),
  };
  transporter = nodemailer.createTransport(sendgridOptions);
}

const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || (process.env.SENDGRID_FROM || null);
const fromName = process.env.EMAIL_FROM_NAME || 'Placement Team';

const logEmailResult = (info, start) => {
  const took = Date.now() - start;
  console.log(`Email sent: messageId=${info?.messageId || 'n/a'} to=${info?.accepted?.join(',') || ''} timeMs=${took}`);
};

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    throw new Error('No email provider configured. Set SMTP_* or SENDGRID_API_KEY in .env.');
  }

  const mail = {
    from: `${fromName} <${fromAddress || process.env.SMTP_USER || process.env.SENDGRID_FROM}>`,
    to,
    subject,
    text,
    html,
  };

  const start = Date.now();
  const info = await transporter.sendMail(mail);
  try {
    logEmailResult(info, start);
  } catch (e) {
    console.warn('Failed to log email result', e);
  }

  return info;
};

export const sendTestEmail = async (to) => {
  return sendEmail({
    to,
    subject: 'Test email from PlaceX',
    text: 'This is a test email to validate SMTP settings and delivery speed.',
    html: '<p>This is a test email to validate SMTP settings and delivery speed.</p>',
  });
};

export const sendRegistrationConfirmation = async (registration) => {
  const { name = 'Applicant', email } = registration;
  if (!email) {
    throw new Error('Registration email is missing.');
  }

  const subject = 'SPL Registration Received — Congratulations!';
  const text = `Hi ${name},\n\nThank you for submitting your SPL registration. We have received your details and will review your application shortly.\n\nWhat happens next?\n- We will review your registration.\n- We will contact you by email or phone with the next steps.\n- Please keep your contact details active.\n\nCongratulations on taking this step.\n\nBest regards,\nPlacement Team`;

  const html = `<p>Hi ${name},</p>\n<p>Thank you for submitting your <strong>SPL registration</strong>. We have received your details and will review your application shortly.</p>\n<h3>What happens next?</h3>\n<ul>\n  <li>We will review your registration.</li>\n  <li>We will contact you by email or phone with the next steps.</li>\n  <li>Please keep your contact details active.</li>\n</ul>\n<p>Congratulations on taking this step.</p>\n<p>Best regards,<br/>Placement Team</p>`;

  if (!transporter) {
    console.warn('No email provider configured; skipping confirmation email for', email);
    return null;
  }

  try {
    const info = await sendEmail({ to: email, subject, text, html });
    return info;
  } catch (err) {
    console.error('Failed to send registration email:', err);
    // don't fail registration for email errors
    return null;
  }
};
