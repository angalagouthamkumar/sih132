import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import User from '../models/User.js';

dotenv.config();

const seedAdmin = async () => {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, ADMIN_PASSWORD } = process.env;

  // Validate presence
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PHONE || !ADMIN_PASSWORD) {
    console.error('[Seed Error] Missing required admin environment variables.');
    console.error('Please ensure ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, and ADMIN_PASSWORD are set in .env');
    process.exit(1);
  }

  const normalizedEmail = ADMIN_EMAIL.toLowerCase().trim();
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(normalizedEmail)) {
    console.error('[Seed Error] Invalid ADMIN_EMAIL format.');
    process.exit(1);
  }

  const trimmedPhone = ADMIN_PHONE.trim();
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(trimmedPhone)) {
    console.error('[Seed Error] ADMIN_PHONE must be exactly 10 digits.');
    process.exit(1);
  }

  if (ADMIN_PASSWORD.length < 8) {
    console.error('[Seed Error] ADMIN_PASSWORD must be at least 8 characters long.');
    process.exit(1);
  }

  const conn = await connectDB();
  if (!conn) {
    console.error('[Seed Error] Failed to connect to MongoDB for seeding.');
    process.exit(1);
  }

  try {
    const existingAdmin = await User.findOne({ email: normalizedEmail });
    if (existingAdmin) {
      console.log(`[Seed Info] Admin with email ${normalizedEmail} already exists. Skipping creation.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create admin; pre-save hook in User model will hash password
    const admin = await User.create({
      name: ADMIN_NAME.trim(),
      email: normalizedEmail,
      phone: trimmedPhone,
      password: ADMIN_PASSWORD,
      role: 'admin',
    });

    console.log(`[Seed Success] Admin created successfully: ${admin.name} (${admin.email})`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error] Failed to create admin: ${error.message}`);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedAdmin();
