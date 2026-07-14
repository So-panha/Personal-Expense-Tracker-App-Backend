const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.post('/auth/forgot-password', auth.forgotPassword);
router.post('/auth/reset-password', auth.resetPassword);
router.post('/auth/google', auth.loginWithGoogle);
router.post('/auth/facebook', auth.loginWithFacebook);

// OTP routes (public)
router.post('/otp/send', auth.sendOtp);
router.post('/otp/verify', auth.verifyOtp);

// Protected routes
router.delete('/auth/logout', authenticate, auth.logout);
router.get('/auth/profile', authenticate, auth.getProfile);
router.put('/auth/profile', authenticate, auth.updateProfile);
router.put('/auth/change-password', authenticate, auth.changePassword);
router.post('/auth/change-email/request', authenticate, auth.requestChangeEmail);
router.post('/auth/change-email/verify', authenticate, auth.verifyNewEmail);
router.put('/auth/profile/avatar', authenticate, upload.single('avatar'), auth.uploadAvatar);
router.delete('/auth/profile/avatar', authenticate, auth.deleteAvatar);

module.exports = router;
