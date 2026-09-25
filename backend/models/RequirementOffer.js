import mongoose from 'mongoose';

const requirementOfferSchema = new mongoose.Schema(
  {
    requirement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Requirement',
      required: [true, 'Requirement reference is required'],
      index: true,
    },
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

// Prevent duplicate pending proposal by the same farmer for the same requirement & crop
requirementOfferSchema.index(
  { requirement: 1, crop: 1, farmer: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
    name: 'one_pending_proposal_per_requirement_crop_farmer',
  }
);

const RequirementOffer = mongoose.model('RequirementOffer', requirementOfferSchema);

export default RequirementOffer;
