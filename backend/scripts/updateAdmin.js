import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/database.js';
import User from '../models/User.js';
import { login } from '../controllers/authController.js';

dotenv.config();

const TARGET_EMAIL = 'angalagouthamkumar@gmail.com';
const TARGET_PASSWORD = 'Kumar@2005';
const TARGET_ROLE = 'admin';

async function run() {
  console.log('[Script] Connecting to MongoDB...');
  const conn = await connectDB();
  if (!conn) {
    console.error('[Script Error] Could not connect to MongoDB.');
    process.exit(1);
  }

  try {
    // 1. Find existing user with role 'admin' or target email
    let user = await User.findOne({
      $or: [
        { role: 'admin' },
        { email: TARGET_EMAIL },
      ],
    }).select('+password');

    if (user) {
      console.log(`[Script] Found existing account: id=${user._id}, email=${user.email}, role=${user.role}`);
      user.email = TARGET_EMAIL;
      user.password = TARGET_PASSWORD; // Model pre-save hook will hash with bcrypt
      user.role = TARGET_ROLE;
      user.isEmailVerified = true;
      user.isActive = true;
      if (!user.name) user.name = 'Platform Administrator';
      if (!user.phone) user.phone = '9876543210';
      await user.save();
      console.log('[Script] Updated existing admin user successfully.');
    } else {
      console.log('[Script] No existing admin user found. Creating new admin user...');
      user = await User.create({
        name: 'Platform Administrator',
        email: TARGET_EMAIL,
        phone: '9876543210',
        password: TARGET_PASSWORD,
        role: TARGET_ROLE,
        isEmailVerified: true,
        isActive: true,
      });
      console.log('[Script] Created new admin user successfully.');
    }

    // 2. Fetch user with password selected to verify
    const adminUser = await User.findOne({ email: TARGET_EMAIL }).select('+password');
    console.log(`[Verification 1] Fetched admin user: ${adminUser.email}`);
    console.log(`[Verification 1] Role: ${adminUser.role}, isEmailVerified: ${adminUser.isEmailVerified}, isActive: ${adminUser.isActive}`);
    console.log(`[Verification 1] Stored password hash starts with: ${adminUser.password?.substring(0, 10)}... (length: ${adminUser.password?.length})`);

    const isMatch = await bcrypt.compare(TARGET_PASSWORD, adminUser.password);
    console.log(`[Verification 1] bcrypt.compare("${TARGET_PASSWORD}", storedHash) result:`, isMatch);
    if (!isMatch) {
      throw new Error('Password hash does NOT match Kumar@2005!');
    }

    // 3. Test login controller simulation
    console.log('[Verification 2] Testing login controller with POST /api/auth/login simulation...');
    let statusCode = null;
    let responseData = null;

    const mockReq = {
      body: {
        email: TARGET_EMAIL,
        password: TARGET_PASSWORD,
        expectedRole: 'admin',
      },
    };

    const mockRes = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      },
    };

    await login(mockReq, mockRes);
    console.log(`[Verification 2] Response HTTP Status: ${statusCode}`);
    console.log('[Verification 2] Response Payload:', JSON.stringify({
      success: responseData?.success,
      message: responseData?.message,
      user: {
        id: responseData?.data?.user?._id,
        name: responseData?.data?.user?.name,
        email: responseData?.data?.user?.email,
        role: responseData?.data?.user?.role,
        isEmailVerified: responseData?.data?.user?.isEmailVerified,
      },
      tokenReceived: !!responseData?.data?.token,
    }, null, 2));

    if (statusCode === 200 && responseData?.success && responseData?.data?.token) {
      console.log('✅ ALL VERIFICATIONS PASSED: Admin updated & authenticated successfully.');
    } else {
      throw new Error(`Login simulation failed with status ${statusCode}: ${JSON.stringify(responseData)}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Script Error]', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

run();
