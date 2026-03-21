const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

function sendOTP(email, otp) {
  return transporter.sendMail({
    from: `"Vaultly" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Vaultly verification code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 2rem; background: #111111; color: #f0f0f0; border-radius: 8px;">
        <h2 style="color: #c9a84c; letter-spacing: 2px; text-transform: uppercase;">Vaultly</h2>
        <p style="color: #a0a0a0; font-size: 0.9rem;">Your verification code is:</p>
        <div style="font-size: 2.5rem; font-weight: bold; letter-spacing: 8px; color: #f0f0f0; margin: 1rem 0;">${otp}</div>
        <p style="color: #707070; font-size: 0.8rem;">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `
  });
}

module.exports = { sendOTP };