const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendOTP(email, otp) {
  await resend.emails.send({
    from: 'Vaultly <onboarding@resend.dev>',
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