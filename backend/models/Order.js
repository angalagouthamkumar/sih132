import mongoose from 'mongoose';

const statusHistoryEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
      required: false,
      sparse: true,
      index: true,
    },
    requirementOffer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RequirementOffer',
      required: false,
      sparse: true,
      index: true,
    },
    requirement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Requirement',
      required: false,
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
    // Financial and crop snapshots — never recalculated from live data
    cropName: {
      type: String,
      required: [true, 'Crop name snapshot is required'],
      trim: true,
    },
    variety: {
      type: String,
      required: [true, 'Variety snapshot is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity snapshot is required'],
    },
    unit: {
      type: String,
      enum: {
        values: ['kg', 'quintal', 'tonne'],
        message: '{VALUE} is not a supported unit. Allowed: kg, quintal, tonne',
      },
      required: [true, 'Unit snapshot is required'],
    },
    offeredPricePerKg: {
      type: Number,
      required: [true, 'Offered price per kg snapshot is required'],
    },
    grossAmount: {
      type: Number,
      required: [true, 'Gross amount snapshot is required'],
    },
    transportCost: {
      type: Number,
      required: true,
      default: 0,
    },
    otherCharges: {
      type: Number,
      required: true,
      default: 0,
    },
    netAmount: {
      type: Number,
      required: [true, 'Net amount snapshot is required'],
    },
    orderStatus: {
      type: String,
      enum: {
        values: ['confirmed', 'in_transit', 'delivered', 'completed'],
        message: '{VALUE} is not a valid order status',
      },
      default: 'confirmed',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'paid'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'pending',
    },
    paymentReference: {
      type: String,
      trim: true,
      maxlength: [100, 'Payment reference cannot exceed 100 characters'],
      default: '',
    },
    statusHistory: {
      type: [statusHistoryEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index(
  { offer: 1 },
  {
    unique: true,
    partialFilterExpression: { offer: { $exists: true, $ne: null } },
    name: 'unique_order_per_crop_offer',
  }
);

orderSchema.index(
  { requirementOffer: 1 },
  {
    unique: true,
    partialFilterExpression: { requirementOffer: { $exists: true, $ne: null } },
    name: 'unique_order_per_requirement_offer',
  }
);

orderSchema.pre('validate', function (next) {
  if (!this.offer && !this.requirementOffer) {
    this.invalidate('offer', 'Either an offer or requirementOffer reference is required.');
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
