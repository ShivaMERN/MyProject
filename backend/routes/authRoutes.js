import express from 'express';
import { registerUser, loginUser, forgotPassword, resetPassword, verifyOTP, resendOTP } from '../controllers/authControllers.js';
import {
  sendMobileOTPController,
  sendEmailOTPController,
  verifyMobileOTP,
  verifyEmailOTP,
  verifyResetOTP
} from '../controllers/otpController.js';

const router = express.Router();

// Existing auth routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// New OTP verification routes for registration
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

// Legacy OTP routes (keeping for backward compatibility)
router.post('/otp/send-mobile', sendMobileOTPController);
router.post('/otp/send-email', sendEmailOTPController);
router.post('/otp/verify-mobile', verifyMobileOTP);
router.post('/otp/verify-email', verifyEmailOTP);
router.post('/otp/verify-reset', verifyResetOTP);

export default router;
