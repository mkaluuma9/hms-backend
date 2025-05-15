const nodemailer = require('nodemailer');
require('dotenv').config(); // make sure this is included to load .env

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME, 
    pass: process.env.EMAIL_PASSWORD, 
  },
});

async function sendEmail({ to, subject, text }) {
  const mailOptions = {
    from: `"Boda Boda Union HR" <${process.env.EMAIL_USERNAME}>`,
    to,
    subject,
    text,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendEmail };
