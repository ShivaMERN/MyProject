// backend/controllers/authController.js
import crypto from 'crypto';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import sendEmail from '../utils/sendEmail.js';
import { logOTPActivity } from '../utils/activityLogger.js';

// Utility to generate JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user (Step 1 - Create user account)
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  const { name, username, email, contactNumber, password } = req.body;

  try {
    // Validate required fields
    if (!name || !username || !email || !contactNumber || !password) {
      return res.status(400).json({
        message: 'All fields are required: name, username, email, contact number, and password'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.trim() },
        { contactNumber: contactNumber.trim() }
      ]
    });

    if (userExists) {
      if (userExists.email === email.toLowerCase()) {
        return res.status(400).json({ message: 'A user with this email already exists' });
      }
      if (userExists.username === username.trim()) {
        return res.status(400).json({ message: 'This username is already taken' });
      }
      if (userExists.contactNumber === contactNumber.trim()) {
        return res.status(400).json({ message: 'A user with this mobile number already exists' });
      }
    }

    const user = await User.create({
      name: name.trim(),
      username: username.trim(),
      email: email.toLowerCase().trim(),
      contactNumber: contactNumber.trim(),
      password,
    });

    if (user) {
      // Determine verification method (prefer mobile if available, fallback to email)
      let verifyWith = 'email';
      if (user.contactNumber) {
        verifyWith = 'mobile';
      }

      // Generate and send OTP
      try {
        const otp = await user.generateAndStoreOTP({
          type: verifyWith,
          ttlSeconds: process.env.OTP_TTL_SECONDS ? parseInt(process.env.OTP_TTL_SECONDS) : 300
        });

        // Send OTP via appropriate method
        let otpSent = false;
        if (verifyWith === 'mobile') {
          // Use existing Twilio integration
          const { sendMobileOTP } = await import('../utils/otpService.js');
          const smsResult = await sendMobileOTP(user.contactNumber, otp);
          otpSent = smsResult.success;
        } else {
          // Send via email
          const { sendEmailOTP } = await import('../utils/otpService.js');
          const emailResult = await sendEmailOTP(user.email, otp, sendEmail);
          otpSent = emailResult.success;
        }

        if (otpSent) {
          // Log successful OTP sending
          await logOTPActivity(
            user,
            'otp_sent',
            verifyWith,
            {
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.get('User-Agent') || 'Unknown',
              method: verifyWith === 'mobile' ? 'sms' : 'email'
            }
          );

          res.status(201).json({
            success: true,
            message: `Account created successfully. Verification OTP sent to your ${verifyWith}.`,
            requiresVerification: true,
            userId: user._id,
            verifyWith: verifyWith
          });
        } else {
          // Log failed OTP sending
          await logOTPActivity(
            user,
            'otp_failed',
            verifyWith,
            {
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.get('User-Agent') || 'Unknown',
              method: verifyWith === 'mobile' ? 'sms' : 'email',
              error: 'OTP_SEND_FAILED'
            }
          );

          // OTP sending failed, but user account was created
          res.status(201).json({
            success: true,
            message: 'Account created successfully, but failed to send verification OTP. Please try resending OTP.',
            requiresVerification: true,
            userId: user._id,
            verifyWith: verifyWith,
            otpSendFailed: true
          });
        }
      } catch (otpError) {
        console.error('OTP generation/sending error:', otpError);
        res.status(201).json({
          success: true,
          message: 'Account created successfully, but failed to send verification OTP. Please try resending OTP.',
          requiresVerification: true,
          userId: user._id,
          verifyWith: verifyWith,
          otpSendFailed: true
        });
      }
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or mobile number

  try {
    // Validate required fields
    if (!identifier || !password) {
      return res.status(400).json({
        message: 'Email/Mobile number and password are required'
      });
    }

    // Determine if identifier is email or mobile number
    const isEmail = identifier.includes('@');
    let user;

    if (isEmail) {
      user = await User.findOne({ email: identifier.toLowerCase() });
      if (!user) {
        return res.status(401).json({
          message: 'No account found with this email address. Please check your email or register for a new account.'
        });
      }
    } else {
      // Assume it's a mobile number
      const formattedNumber = identifier.replace(/\D/g, '');
      user = await User.findOne({ contactNumber: formattedNumber });
      if (!user) {
        return res.status(401).json({
          message: 'No account found with this mobile number. Please check your number or register for a new account.'
        });
      }
    }

    if (!user.isActive) {
      return res.status(401).json({
        message: 'Your account has been deactivated. Please contact support for assistance.'
      });
    }

    const isPasswordValid = await user.matchPassword(password);

    if (user && isPasswordValid) {
      // Check if verification is required and user is not fully verified
      if (user.requireVerification) {
        const incompleteVerification = [];
        if (!user.isMobileVerified && user.contactNumber) {
          incompleteVerification.push('mobile');
        }
        if (!user.isEmailVerified && user.email) {
          incompleteVerification.push('email');
        }

        if (incompleteVerification.length > 0) {
          return res.status(403).json({
            success: false,
            message: 'Account not verified. Please complete verification before logging in.',
            requiresVerification: true,
            incomplete: incompleteVerification,
            userId: user._id
          });
        }
      }

      // Update last login
      user.lastLogin = new Date();

      // Add login history
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent') || 'Unknown';

      user.loginHistory.push({
        timestamp: new Date(),
        ipAddress,
        userAgent
      });

      // Keep only last 10 login records
      if (user.loginHistory.length > 10) {
        user.loginHistory = user.loginHistory.slice(-10);
      }

      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        contactNumber: user.contactNumber,
        role: user.role,
        isActive: user.isActive,
        isMobileVerified: user.isMobileVerified,
        isEmailVerified: user.isEmailVerified,
        token: generateToken(user._id),
      });
    } else {
      return res.status(401).json({
        message: 'Incorrect password. Please check your password and try again.'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  let user;

  try {
    user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({ message: "There is no user with that email" });
    }

    // Generate a 6-digit code instead of a long token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash token and set to user
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please use the following code to reset your password. It is valid for 10 minutes:\n\nYour code: ${resetToken}`;

    console.log('Sending reset code email to:', user.email); // Log email sending

    await sendEmail({
      email: user.email,
      subject: 'Password Reset Code',
      message,
    });

    res.status(200).json({ message: 'Email sent' });

  } catch (error) {
    // If an error occurs (like email sending failed), clean up the token fields.
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
    }
    res.status(500).json({ message: 'Email could not be sent', error: error.message });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword
export const resetPassword = async (req, res) => {
  // The token from the URL is the user-provided 6-digit code
  const resetToken = req.params.resettoken;

  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({ message: "Invalid or expired code" });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful", token: generateToken(user._id) });

  } catch (error) {
     res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Verify OTP for registration
// @route   POST /api/auth/verify-otp
export const verifyOTP = async (req, res) => {
  const { userId, type, otp } = req.body;

  try {
    // Validate required fields
    if (!userId || !type || !otp) {
      return res.status(400).json({
        success: false,
        message: 'User ID, type, and OTP are required'
      });
    }

    if (!['mobile', 'email'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "mobile" or "email"'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Verify OTP
    const verificationResult = await user.verifyOTP({ type, rawOtp: otp });

    if (verificationResult.success) {
      // Check if user is now fully verified
      const isFullyVerified = user.isMobileVerified && user.isEmailVerified;

      // Log successful OTP verification
      await logOTPActivity(
        user,
        'otp_verified',
        type,
        {
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent') || 'Unknown',
          autoLoggedIn: isFullyVerified && process.env.OTP_AUTO_LOGIN === 'true'
        }
      );

      // Log account fully verified if applicable
      if (isFullyVerified) {
        await logOTPActivity(
          user,
          'account_verified',
          type,
          {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent') || 'Unknown'
          }
        );
      }

      let response = {
        success: true,
        message: verificationResult.message,
        verified: true
      };

      // If fully verified and auto-login is enabled, include token
      if (isFullyVerified && process.env.OTP_AUTO_LOGIN === 'true') {
        response.token = generateToken(user._id);
        response.autoLoggedIn = true;
      }

      res.json(response);
    } else {
      // Log failed OTP verification
      await logOTPActivity(
        user,
        'otp_failed',
        type,
        {
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent') || 'Unknown',
          errorCode: verificationResult.code,
          remainingAttempts: verificationResult.remainingAttempts
        }
      );

      // Return appropriate error based on verification result
      let statusCode = 400;
      if (verificationResult.code === 'EXPIRED') {
        statusCode = 410; // Gone
      } else if (verificationResult.code === 'TOO_MANY_ATTEMPTS') {
        statusCode = 429; // Too Many Requests
      }

      res.status(statusCode).json({
        success: false,
        message: verificationResult.message,
        code: verificationResult.code,
        remainingAttempts: verificationResult.remainingAttempts
      });
    }

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying OTP'
    });
  }
};

// @desc    Resend OTP for registration
// @route   POST /api/auth/resend-otp
export const resendOTP = async (req, res) => {
  const { userId, type } = req.body;

  try {
    // Validate required fields
    if (!userId || !type) {
      return res.status(400).json({
        success: false,
        message: 'User ID and type are required'
      });
    }

    if (!['mobile', 'email'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "mobile" or "email"'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Check if user can resend OTP
    const canResend = user.canResendOTP();
    if (!canResend.canResend) {
      return res.status(429).json({
        success: false,
        message: canResend.reason
      });
    }

    // Generate new OTP
    const otp = await user.generateAndStoreOTP({
      type,
      ttlSeconds: process.env.OTP_TTL_SECONDS ? parseInt(process.env.OTP_TTL_SECONDS) : 300
    });

    // Increment resend count
    user.otpResendCount += 1;
    await user.save();

    // Send OTP via appropriate method
    let otpSent = false;
    if (type === 'mobile') {
      const { sendMobileOTP } = await import('../utils/otpService.js');
      const smsResult = await sendMobileOTP(user.contactNumber, otp);
      otpSent = smsResult.success;
    } else {
      const { sendEmailOTP } = await import('../utils/otpService.js');
      const emailResult = await sendEmailOTP(user.email, otp, sendEmail);
      otpSent = emailResult.success;
    }

    if (otpSent) {
      // Log successful OTP resend
      await logOTPActivity(
        user,
        'otp_resend',
        type,
        {
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent') || 'Unknown',
          method: type === 'mobile' ? 'sms' : 'email',
          resendCount: user.otpResendCount
        }
      );

      res.json({
        success: true,
        message: `OTP resent successfully to your ${type}`
      });
    } else {
      // Log failed OTP resend
      await logOTPActivity(
        user,
        'otp_failed',
        type,
        {
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent') || 'Unknown',
          method: type === 'mobile' ? 'sms' : 'email',
          error: 'OTP_RESEND_FAILED',
          resendCount: user.otpResendCount
        }
      );

      res.status(500).json({
        success: false,
        message: `Failed to send OTP to your ${type}. Please try again later.`
      });
    }

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resending OTP'
    });
  }
};
