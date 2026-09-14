import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured on the server.');
  }
  return jwt.sign({ id, role }, secret, { expiresIn: '7d' });
};

// @desc    Register a new farmer or buyer
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, phone, password, role, location, businessName } = req.body;

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

    const emailRegex = /^\S+@\S+\.\S+$/;
    const normalizedEmail = email.toLowerCase().trim();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
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

    // Create user (no mass assignment)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: trimmedPhone,
      password,
      role,
      location: location ? location.trim() : '',
      businessName: role === 'buyer' ? businessName.trim() : undefined,
    });

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
