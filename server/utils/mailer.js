import nodemailer from 'nodemailer';

const isSmtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!isSmtpConfigured || !transporter) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env.');
  }

  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const fromName = process.env.EMAIL_FROM_NAME || 'Placement Team';

  return transporter.sendMail({
    from: `${fromName} <${fromAddress}>`,
    to,
    subject,
    text,
    html,
  });
};

export const sendRegistrationConfirmation = async (registration) => {
  const { name = 'Applicant', email } = registration;
  if (!email) {
    throw new Error('Registration email is missing.');
  }

  const subject = 'SPL Registration Received — Congratulations!';
  const text = `Hi ${name},

Thank you for submitting your SPL registration. We have received your details and will review your application shortly.

What happens next?
- We will review your registration.
- We will contact you by email or phone with the next steps.
- Please keep your contact details active.

Congratulations on taking this step.

Best regards,
Placement Team`;

  const html = `<p>Hi ${name},</p>
<p>Thank you for submitting your <strong>SPL registration</strong>. We have received your details and will review your application shortly.</p>
<h3>What happens next?</h3>
<ul>
  <li>We will review your registration.</li>
  <li>We will contact you by email or phone with the next steps.</li>
  <li>Please keep your contact details active.</li>
</ul>
<p>Congratulations on taking this step.</p>
<p>Best regards,<br/>Placement Team</p>`;

  return sendEmail({ to: email, subject, text, html });
};
