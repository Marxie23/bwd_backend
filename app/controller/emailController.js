require('dotenv').config();
const nodemailer = require('nodemailer');

// Create a transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Use environment variables for sensitive data
    pass: process.env.EMAIL_PASS,
  },
});

// Define mail options
const mailOptions = {
  from: process.env.EMAIL_USER,
  to: 'recipient-email@example.com',
  subject: 'Hello from Nodemailer!',
  text: 'This is a test email sent using Nodemailer.',
};

// Send the email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Email sent:', info.response);
  }
});
