import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^\d{10}$/, 'Phone number must be a valid 10-digit number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['farmer', 'buyer', 'admin'],
        message: '{VALUE} is not a valid role',
      },
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    businessName: {
      type: String,
      trim: true,
      validate: {
        validator: function (value) {
          if (this.role === 'buyer') {
            return typeof value === 'string' && value.trim().length > 0;
          }
          return true;
        },
        message: 'Business name is required for buyers',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ['pending', 'verified', 'rejected'],
        message: '{VALUE} is not a valid verification status',
      },
      default: 'pending',
    },
    latitude: {
      type: Number,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Safe JSON serialization: Never return password hash
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;
