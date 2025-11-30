import sendEmail from './utils/sendEmail.js';

console.log('EMAIL_HOST:', process.env.EMAIL_HOST); // Check if env var is loaded

const testEmail = async () => {
  try {
    console.log('🧪 Testing email functionality...');

    await sendEmail({
      email: 'shivamrakhonde@gmail.com', // Replace with your actual email
      subject: 'Test Email from Chart Maker',
      message: 'This is a test email to verify that the email configuration is working correctly. If you receive this email, the OTP functionality should work!'
    });

    console.log('✅ Test email sent successfully!');
    console.log('📧 Check your email inbox (including spam folder)');

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
};

// Run the test
testEmail();
