import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      required: [true, 'Crop reference is required'],
      index: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer reference is required'],
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer reference is required'],
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.01, 'Quantity must be greater than 0'],
    },
    unit: {
      type: String,
      enum: {
        values: ['kg', 'quintal', 'tonne'],
        message: '{VALUE} is not a supported unit. Allowed: kg, quintal, tonne',
      },
      required: [true, 'Unit of measure is required'],
    },
    offeredPricePerKg: {
      type: Number,
      required: [true, 'Offered price per kg is required'],
      min: [0.01, 'Offered price per kg must be greater than 0'],
    },
    transportCost: {
      type: Number,
      default: 0,
      min: [0, 'Transport cost cannot be negative'],
    },
    otherCharges: {
      type: Number,
      default: 0,
      min: [0, 'Other charges cannot be negative'],
    },
    grossAmount: {
      type: Number,
      required: [true, 'Gross amount is required'],
    },
    netRealization: {
      type: Number,
      required: [true, 'Net realization is required'],
    },
    message: {
      type: String,
      trim: true,
      maxlength: [300, 'Message cannot exceed 300 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'rejected'],
        message: '{VALUE} is not a valid status. Allowed: pending, accepted, rejected',
      },
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Offer = mongoose.model('Offer', offerSchema);

export default Offer;
