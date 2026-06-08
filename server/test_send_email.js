import dotenv from 'dotenv';

dotenv.config();

(async () => {
  const { sendTestEmail } = await import('./utils/mailer.js');
  const to = process.env.TEST_EMAIL || process.env.SMTP_USER || process.env.SENDGRID_FROM;

  if (!to) {
    console.error('No test recipient configured. Set TEST_EMAIL or SMTP_USER in .env');
    process.exit(1);
  }

  try {
    console.log('Sending test email to', to);
    const info = await sendTestEmail(to);
    console.log('Send result:', info);
    console.log('Check receiver inbox and spam folder.');
    process.exit(0);
  } catch (err) {
    console.error('Test send failed:', err);
    process.exit(1);
  }
})();
