// server/utils/emailUtils.js
const nodemailer = require('nodemailer');

const isConfigured = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);

// Built lazily: creating a transporter with no credentials would only fail
// later, at send time, on every message.
let transporter = null;

const getTransporter = () => {
  if (!isConfigured) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  return transporter;
};

const clientUrl = () => (process.env.CLIENT_URL || '').split(',')[0].trim() || '';

/**
 * Email is a nice-to-have notification channel here, never a hard dependency:
 * a failure is logged and swallowed so the request that triggered it succeeds.
 */
const send = async (mailOptions) => {
  const mailer = getTransporter();

  if (!mailer) {
    console.warn(`Email not sent (EMAIL_USER/EMAIL_PASSWORD not set): "${mailOptions.subject}"`);
    return false;
  }

  try {
    await mailer.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@travelbuddy.com',
      ...mailOptions,
    });
    return true;
  } catch (error) {
    console.error('Email sending error:', error.message);
    return false;
  }
};

const layout = (title, body) => `
  <div style="max-width: 600px; margin: 0 auto; padding: 24px; font-family: Arial, Helvetica, sans-serif; color: #1f2937;">
    <h2 style="color: #2563eb; margin-top: 0;">${title}</h2>
    ${body}
    <p style="margin-top: 32px; font-size: 12px; color: #6b7280;">Travel Buddy — student travel, together.</p>
  </div>
`;

const button = (href, label) => `
  <div style="text-align: center; margin: 28px 0;">
    <a href="${href}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">${label}</a>
  </div>
`;

const sendVerificationEmail = (to, token) => {
  const url = `${clientUrl()}/verify-email?token=${token}`;

  return send({
    to,
    subject: 'Verify your Travel Buddy account',
    html: layout(
      'Welcome to Travel Buddy',
      `<p>Thanks for signing up. Confirm your email address to finish setting up your account.</p>
       ${button(url, 'Verify email')}
       <p>If the button does not work, paste this link into your browser:</p>
       <p style="word-break: break-all;">${url}</p>
       <p>This link expires in 24 hours. If you did not sign up, you can ignore this email.</p>`
    ),
  });
};

const sendJourneyRequestEmail = (to, journey, requester) => {
  if (!to) return Promise.resolve(false);

  const url = `${clientUrl()}/journeys/${journey._id}`;
  const departure = new Date(journey.departureDate).toLocaleDateString();

  return send({
    to,
    subject: 'New travel companion request',
    html: layout(
      'New travel companion request',
      `<p><strong>${requester.fullName}</strong> asked to join your journey from
        <strong>${journey.origin}</strong> to <strong>${journey.destination}</strong> on
        <strong>${departure}</strong>.</p>
       ${button(url, 'View request')}
       <p>You can accept or decline from the journey page.</p>`
    ),
  });
};

module.exports = {
  sendVerificationEmail,
  sendJourneyRequestEmail,
  isConfigured,
};
