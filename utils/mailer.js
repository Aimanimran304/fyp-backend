import nodemailer from "nodemailer";

// ─── Transporter (Gmail SMTP) ────────────────────────────────────────────────
// .env mein ye 2 variables zaroor set karo:
//   EMAIL_USER = your-gmail@gmail.com
//   EMAIL_PASS = your-16-digit-app-password   (Gmail "App Passwords" se generate karo, normal password nahi chalega)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Send OTP Email ───────────────────────────────────────────────────────────
export const sendOtpEmail = async (toEmail, otp, name = "") => {
  const html = `
  <div style="background-color:#231e0f; padding:40px 20px; font-family: Arial, sans-serif;">
    <div style="max-width:480px; margin:0 auto; background-color:#2b2412; border:1px solid rgba(234,179,8,0.15); border-radius:16px; padding:32px; text-align:center;">
      <div style="width:56px; height:56px; background-color:#facc15; border-radius:12px; display:inline-flex; align-items:center; justify-content:center; margin-bottom:16px;">
        <span style="font-size:24px;">🍽️</span>
      </div>
      <h1 style="color:#ffffff; font-size:22px; margin:0 0 4px;">RestroTech</h1>
      <p style="color:#9ca3af; font-size:13px; margin:0 0 28px;">Password Reset Request</p>

      <p style="color:#e5e7eb; font-size:14px; line-height:1.6; margin:0 0 20px;">
        Hi ${name || "there"}, use the code below to reset your password. This code expires in <strong style="color:#facc15;">10 minutes</strong>.
      </p>

      <div style="background-color:#1f1a0d; border:1px solid rgba(234,179,8,0.3); border-radius:12px; padding:16px; margin:0 0 24px;">
        <span style="color:#facc15; font-size:32px; font-weight:bold; letter-spacing:8px;">${otp}</span>
      </div>

      <p style="color:#6b7280; font-size:12px; margin:0;">
        Agar aap ne ye request nahi ki, to ye email ignore kar dein. Aapka password tab tak safe hai.
      </p>
    </div>
  </div>
  `;

  await transporter.sendMail({
    from: `"RestroTech" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your RestroTech Password Reset Code",
    html,
  });
};