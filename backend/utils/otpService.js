import crypto from 'crypto';
import twilio from 'twilio';

// Initialize Twilio (you'll need to configure these in your .env file)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;

if (accountSid && authToken && twilioPhoneNumber) {
  twilioClient = twilio(accountSid, authToken);
}

// Generate a 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Hash OTP for storage
export const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

// Send SMS via Twilio
export const sendSMS = async (to, message) => {
  if (!twilioClient) {
    console.error('Twilio not configured. SMS not sent.');
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to
    });

    console.log('SMS sent successfully:', result.sid);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('SMS sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Send OTP via SMS
export const sendMobileOTP = async (contactNumber, otp) => {
  const message = `Your verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;

  return await sendSMS(contactNumber, message);
};

// Send OTP via Email (using existing email service)
export const sendEmailOTP = async (email, otp, sendEmail) => {
  const message = `Your verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;

  try {
    await sendEmail({
      email: email,
      subject: 'Email Verification Code',
      message,
    });
    return { success: true };
  } catch (error) {
    console.error('Email OTP sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Verify OTP
export const verifyOTP = (enteredOTP, hashedOTP, otpExpire) => {
  // Check if OTP has expired
  if (otpExpire < new Date()) {
    return { valid: false, message: 'OTP has expired' };
  }

  // Hash the entered OTP and compare
  const enteredOTPhash = hashOTP(enteredOTP);
  const isValid = enteredOTPhash === hashedOTP;

  return {
    valid: isValid,
    message: isValid ? 'OTP verified successfully' : 'Invalid OTP'
  };
};

// Check if OTP is expired
export const isOTPExpired = (otpExpire) => {
  return otpExpire < new Date();
};

// Format contact number for international SMS
export const formatContactNumber = (contactNumber) => {
  // Remove all non-digit characters
  const cleaned = contactNumber.replace(/\D/g, '');

  // Add country code if not present (assuming India +91)
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  } else if (cleaned.length === 13 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }

  return contactNumber; // Return as is if already formatted
};
