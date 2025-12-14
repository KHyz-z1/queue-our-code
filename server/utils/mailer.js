const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});



async function sendAdminEmail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"Star Parks Admin" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    console.log("📧 Email sent to:", to);
    return info; // Return the info object in case the caller needs it
  } catch (err) {
    console.error("❌ Email send failed:", err);
    throw err; // Re-throw the error so the calling function knows it failed
  }
}

module.exports = {
  sendAdminEmail
};