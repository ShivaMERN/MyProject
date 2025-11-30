// backend/utils/sendEmail.js
import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  try {
    // Check if email configuration is properly set
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email configuration not set. Logging email instead:');
      console.log('To:', options.email);
      console.log('Subject:', options.subject);
      console.log('Message:', options.message);
      return; // Don't throw error, just log
    }

    // 1) Create a transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 2) Define the email options
    const mailOptions = {
      from: 'Chart Maker <noreply@chartmaker.com>',
      to: options.email,
      subject: options.subject,
      text: options.message,
      // html: can also be used
    };

    // 3) Actually send the email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email sending failed:', error);
    // Don't throw the error, just log it so the app continues to work
    console.log('Email would have been sent to:', options.email);
    console.log('Subject:', options.subject);
    console.log('Message:', options.message);
  }
};

export default sendEmail;
