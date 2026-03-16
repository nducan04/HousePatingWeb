const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Send an email alert
 * @param {Object} options - { email, subject, message }
 */
const sendAlertEmail = async (options) => {
  // If no SMTP user is provided, just log to console for development
  if (!process.env.SMTP_USER) {
    console.log(`[MOCK EMAIL] To: ${options.email} | Subject: ${options.subject}`);
    console.log(`Message: \n${options.message}`);
    return;
  }

  const mailOptions = {
    from: process.env.ALERT_FROM || 'VTSC System <noreply@vtsc.vn>',
    to: options.email,
    subject: options.subject,
    html: options.message
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Message sent: ${info.messageId}`);
};

module.exports = sendAlertEmail;
