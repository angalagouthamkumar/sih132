import mongoose from 'mongoose';

const requirementSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer reference is required'],
    },
    cropName: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
    },
    variety: {
      type: String,
      required: [true, 'Variety is required'],
      trim: true,
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
        message: '{VALUE} is not a supported unit',
      },
      default: 'kg',
    },
    targetPricePerKg: {
      type: Number,
      required: [true, 'Target price is required'],
      min: [0.01, 'Target price must be greater than 0'],
    },
    deliveryLocation: {
      type: String,
      required: [true, 'Delivery location is required'],
      trim: true,
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
    requiredDate: {
      type: Date,
      required: [true, 'Required date is required'],
    },
    qualityNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'fulfilled', 'closed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

const Requirement = mongoose.model('Requirement', requirementSchema);

export default Requirement;
