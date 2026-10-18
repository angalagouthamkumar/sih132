import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { sendOTPEmail } from '../utils/sendEmail.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured on the server.');
  }
  return jwt.sign({ id, role }, secret, { expiresIn: '7d' });
};

// In-memory verification store for pending signup OTPs
// Record<email, { otp: string, expires: number }>
const signupOTPStore = {};

// Periodic cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const storedEmail in signupOTPStore) {
    if (signupOTPStore[storedEmail]?.expires <= now) {
      delete signupOTPStore[storedEmail];
    }
  }
}, 5 * 60 * 1000).unref();

// @desc    Send verification OTP for new user signup
// @route   POST /api/auth/send-signup-otp
// @access  Public
export const sendSignupOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify that normalizedEmail ends with '@gmail.com' and is a valid email format
    const emailRegex = /^[^\s@]+@gmail\.com$/;
    if (!normalizedEmail.endsWith('@gmail.com') || !emailRegex.test(normalizedEmail) || normalizedEmail.length <= 10) {
      return res.status(400).json({
        success: false,
        message: 'Only valid @gmail.com addresses are accepted.',
      });
    }

    // Check MongoDB: If user already exists, return 400
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This Gmail address is already registered. Please sign in instead.',
      });
    }

    // Generate 6-digit numeric OTP and save to signupOTPStore
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    signupOTPStore[normalizedEmail] = {
      otp,
      expires: Date.now() + 10 * 60 * 1000,
    };

    // Dispatch Email directly via sendOTPEmail
    try {
      await sendOTPEmail(normalizedEmail, String(otp), { isSignup: true });
    } catch (err) {
      delete signupOTPStore[normalizedEmail];
      console.error("SIGNUP OTP EMAIL ERROR:", err);
      return res.status(400).json({
        success: false,
        message: 'Could not deliver OTP to this Gmail address. Please check for typos and try again.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification OTP sent to your Gmail inbox.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error occurred while sending signup OTP.',
    });
  }
};

// @desc    Register a new farmer or buyer
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, phone, password, role, location, businessName, otp } = req.body;

    // Reject admin registration
    if (role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Admin registration is not permitted via public registration.',
      });
    }

    // Validate role
    if (!['farmer', 'buyer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either "farmer" or "buyer".',
      });
    }

    // Manual validation of required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required.',
      });
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@gmail\.com$/;
    if (!normalizedEmail.endsWith('@gmail.com') || !emailRegex.test(normalizedEmail) || normalizedEmail.length <= 10) {
      return res.status(400).json({
        success: false,
        message: 'Only valid @gmail.com addresses are accepted.',
      });
    }

    // Strict OTP Verification for Registration
    const stored = signupOTPStore[normalizedEmail];
    if (!otp || !stored || stored.expires < Date.now() || String(stored.otp).trim() !== String(otp).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code. Please check your Gmail inbox.',
      });
    }


    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required.',
      });
    }

    const phoneRegex = /^\d{10}$/;
    const trimmedPhone = phone.trim();
    if (!phoneRegex.test(trimmedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be exactly 10 digits.',
      });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    // Validate businessName for buyers
    if (role === 'buyer') {
      if (!businessName || typeof businessName !== 'string' || !businessName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Business name is required for buyers.',
        });
      }
    }

    // Check for duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Create user (no mass assignment) with isEmailVerified: true
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: trimmedPhone,
      password,
      role,
      location: location ? location.trim() : '',
      businessName: role === 'buyer' ? businessName.trim() : undefined,
      isEmailVerified: true,
    });

    // Delete verified OTP from store
    delete signupOTPStore[normalizedEmail];

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error occurred during registration.',
    });
  }
};


// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password, expectedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.',
      });
    }

    // Check if actual role matches expectedRole
    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This portal is for ${expectedRole} accounts, but this account is registered as ${user.role}.`,
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error occurred during login.',
    });
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private (Protected by JWT)
export const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Current user profile fetched successfully.',
      data: {
        user: req.user.toJSON(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving user profile.',
    });
  }
};

// @desc    Authenticate with Google OAuth ID token
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req, res) => {
  try {
    const { idToken, expectedRole } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required.',
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({
        success: false,
        message: 'GOOGLE_CLIENT_ID is not configured on the server.',
      });
    }

    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken,
        audience: clientId,
      });
    } catch (verifyError) {
      return res.status(401).json({
        success: false,
        message: `Google token verification failed: ${verifyError.message}`,
      });
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Google account profile does not contain an email address.',
      });
    }

    const normalizedEmail = payload.email.toLowerCase().trim();
    const googleSub = payload.sub;
    const name = payload.name || payload.given_name || 'Google User';
    const picture = payload.picture || '';
    const emailVerified = !!payload.email_verified;

    // Find existing user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId: googleSub }, { email: normalizedEmail }],
    });

    if (user) {
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account has been deactivated. Please contact support.',
        });
      }

      // Enforce expected role matching
      if (expectedRole && user.role !== expectedRole) {
        return res.status(403).json({
          success: false,
          message: `Access denied. This portal is for ${expectedRole} accounts, but this account is registered as ${user.role}.`,
        });
      }

      // Link Google ID and update avatar/verification if missing
      let updated = false;
      if (!user.googleId) {
        user.googleId = googleSub;
        updated = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
        updated = true;
      }
      if (!user.isEmailVerified && emailVerified) {
        user.isEmailVerified = emailVerified;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    } else {
      // Disallow automatic registration for admin role
      if (expectedRole === 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin accounts cannot be self-registered via Google. Please contact support.',
        });
      }

      const targetRole = expectedRole && ['farmer', 'buyer'].includes(expectedRole)
        ? expectedRole
        : 'farmer';

      user = await User.create({
        name,
        email: normalizedEmail,
        googleId: googleSub,
        authProvider: 'google',
        role: targetRole,
        avatar: picture,
        isEmailVerified: emailVerified,
        businessName: targetRole === 'buyer' ? `${name}'s Business` : undefined,
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful.',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error occurred during Google authentication.',
    });
  }
};

// @desc    Initiate password reset (Generate 6-digit OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address. Please verify your email or sign up.',
      });
    }

    if (user.authProvider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'This email is registered via Google Sign-In. Please log in using Google.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact support.',
      });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = expiry;
    await user.save();

    try {
      await sendOTPEmail(user.email, otp);
    } catch (emailError) {
      // Revert OTP if email delivery failed
      user.resetPasswordOTP = undefined;
      user.resetPasswordOTPExpires = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please check your email address and try again later.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your Gmail inbox.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error initiating password reset.',
    });
  }
};



// @desc    Verify password reset OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and 6-digit OTP are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+resetPasswordOTP +resetPasswordOTPExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.',
      });
    }

    if (!user.resetPasswordOTP || !user.resetPasswordOTPExpires) {
      return res.status(400).json({
        success: false,
        message: 'No active password reset request found. Please request a new OTP.',
      });
    }

    if (user.resetPasswordOTPExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'The OTP has expired. Please request a new one.',
      });
    }

    if (user.resetPasswordOTP.trim() !== String(otp).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please check and try again.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You may now reset your password.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error verifying OTP.',
    });
  }
};

// @desc    Reset password using verified OTP
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required.',
      });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+resetPasswordOTP +resetPasswordOTPExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.',
      });
    }

    if (!user.resetPasswordOTP || !user.resetPasswordOTPExpires) {
      return res.status(400).json({
        success: false,
        message: 'No active password reset request found. Please request a new OTP.',
      });
    }

    if (user.resetPasswordOTPExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'The OTP has expired. Please request a new one.',
      });
    }

    if (user.resetPasswordOTP.trim() !== String(otp).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please check and try again.',
      });
    }

    // Set new password (pre-save hook will hash it)
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save();

    console.log(`[Auth Password Reset] Password successfully updated for ${normalizedEmail}`);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You may now sign in with your new password.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error resetting password.',
    });
  }
};


