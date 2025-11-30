import User from '../models/User.js';
import {
  generateOTP,
  hashOTP,
  sendMobileOTP,
  sendEmailOTP,
  verifyOTP,
  isOTPExpired,
  formatContactNumber
} from '../utils/otpService.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Send OTP to mobile number
// @route   POST /api/otp/send-mobile
export const sendMobileOTPController = async (req, res) => {
  const { contactNumber } = req.body;

  try {
    if (!contactNumber) {
      return res.status(400).json({
        message: 'Contact number is required'
      });
    }

    const formattedNumber = formatContactNumber(contactNumber);

    // Check if user exists
    const user = await User.findOne({ contactNumber: formattedNumber });

    if (!user) {
      return res.status(404).json({
        message: 'No account found with this mobile number'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Check if there's already a valid OTP
    if (user.mobileOTP && !isOTPExpired(user.mobileOTPExpire)) {
      return res.status(429).json({
        message: 'OTP already sent. Please wait before requesting a new one.'
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with new OTP
    user.mobileOTP = hashedOTP;
    user.mobileOTPExpire = otpExpire;
    await user.save();

    // Send OTP via SMS
    const smsResult = await sendMobileOTP(formattedNumber, otp);

    if (smsResult.success) {
      res.json({
        message: 'OTP sent successfully to your mobile number',
        expiresIn: 10 // minutes
      });
    } else {
      // Clear OTP if SMS failed
      user.mobileOTP = undefined;
      user.mobileOTPExpire = undefined;
      await user.save();

      res.status(500).json({
        message: 'Failed to send OTP. Please try again later.'
      });
    }

  } catch (error) {
    console.error('Send mobile OTP error:', error);
    res.status(500).json({
      message: 'Server error while sending OTP'
    });
  }
};

// @desc    Send OTP to email
// @route   POST /api/otp/send-email
export const sendEmailOTPController = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: 'No account found with this email address'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Check if there's already a valid OTP
    if (user.emailOTP && !isOTPExpired(user.emailOTPExpire)) {
      return res.status(429).json({
        message: 'OTP already sent. Please wait before requesting a new one.'
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with new OTP
    user.emailOTP = hashedOTP;
    user.emailOTPExpire = otpExpire;
    await user.save();

    // Send OTP via email
    const emailResult = await sendEmailOTP(email, otp, sendEmail);

    if (emailResult.success) {
      res.json({
        message: 'OTP sent successfully to your email',
        expiresIn: 10 // minutes
      });
    } else {
      // Clear OTP if email failed
      user.emailOTP = undefined;
      user.emailOTPExpire = undefined;
      await user.save();

      res.status(500).json({
        message: 'Failed to send OTP. Please try again later.'
      });
    }

  } catch (error) {
    console.error('Send email OTP error:', error);
    res.status(500).json({
      message: 'Server error while sending OTP'
    });
  }
};

// @desc    Verify mobile OTP
// @route   POST /api/otp/verify-mobile
export const verifyMobileOTP = async (req, res) => {
  const { contactNumber, otp } = req.body;

  try {
    if (!contactNumber || !otp) {
      return res.status(400).json({
        message: 'Contact number and OTP are required'
      });
    }

    const formattedNumber = formatContactNumber(contactNumber);

    const user = await User.findOne({ contactNumber: formattedNumber });

    if (!user) {
      return res.status(404).json({
        message: 'No account found with this mobile number'
      });
    }

    if (!user.mobileOTP || !user.mobileOTPExpire) {
      return res.status(400).json({
        message: 'No OTP request found. Please request a new OTP.'
      });
    }

    // Verify OTP
    const verification = verifyOTP(otp, user.mobileOTP, user.mobileOTPExpire);

    if (verification.valid) {
      // Mark mobile as verified
      user.isMobileVerified = true;
      user.mobileOTP = undefined;
      user.mobileOTPExpire = undefined;
      await user.save();

      res.json({
        message: 'Mobile number verified successfully',
        verified: true
      });
    } else {
      res.status(400).json({
        message: verification.message,
        verified: false
      });
    }

  } catch (error) {
    console.error('Verify mobile OTP error:', error);
    res.status(500).json({
      message: 'Server error while verifying OTP'
    });
  }
};

// @desc    Verify email OTP
// @route   POST /api/otp/verify-email
export const verifyEmailOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({
        message: 'Email and OTP are required'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: 'No account found with this email address'
      });
    }

    if (!user.emailOTP || !user.emailOTPExpire) {
      return res.status(400).json({
        message: 'No OTP request found. Please request a new OTP.'
      });
    }

    // Verify OTP
    const verification = verifyOTP(otp, user.emailOTP, user.emailOTPExpire);

    if (verification.valid) {
      // Mark email as verified
      user.isEmailVerified = true;
      user.emailOTP = undefined;
      user.emailOTPExpire = undefined;
      await user.save();

      res.json({
        message: 'Email verified successfully',
        verified: true
      });
    } else {
      res.status(400).json({
        message: verification.message,
        verified: false
      });
    }

  } catch (error) {
    console.error('Verify email OTP error:', error);
    res.status(500).json({
      message: 'Server error while verifying OTP'
    });
  }
};

// @desc    Verify OTP for password reset
// @route   POST /api/otp/verify-reset
export const verifyResetOTP = async (req, res) => {
  const { identifier, otp, type } = req.body; // identifier can be email or contactNumber, type is 'email' or 'mobile'

  try {
    if (!identifier || !otp || !type) {
      return res.status(400).json({
        message: 'Identifier, OTP, and type are required'
      });
    }

    let user;
    if (type === 'email') {
      user = await User.findOne({ email: identifier });
    } else if (type === 'mobile') {
      const formattedNumber = formatContactNumber(identifier);
      user = await User.findOne({ contactNumber: formattedNumber });
    } else {
      return res.status(400).json({
        message: 'Type must be either "email" or "mobile"'
      });
    }

    if (!user) {
      return res.status(404).json({
        message: `No account found with this ${type}`
      });
    }

    // Check which OTP to verify
    let otpField, otpExpireField;
    if (type === 'email') {
      otpField = 'emailOTP';
      otpExpireField = 'emailOTPExpire';
    } else {
      otpField = 'mobileOTP';
      otpExpireField = 'mobileOTPExpire';
    }

    if (!user[otpField] || !user[otpExpireField]) {
      return res.status(400).json({
        message: 'No OTP request found. Please request a new OTP.'
      });
    }

    // Verify OTP
    const verification = verifyOTP(otp, user[otpField], user[otpExpireField]);

    if (verification.valid) {
      // Clear the OTP
      user[otpField] = undefined;
      user[otpExpireField] = undefined;
      await user.save();

      res.json({
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} verified successfully`,
        verified: true,
        userId: user._id
      });
    } else {
      res.status(400).json({
        message: verification.message,
        verified: false
      });
    }

  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({
      message: 'Server error while verifying OTP'
    });
  }
};
