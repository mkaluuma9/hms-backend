const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your gmail
    pass: process.env.EMAIL_PASS, // app password recommended
  },
});

async function sendEmail({ to, subject, text }) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendEmail };
