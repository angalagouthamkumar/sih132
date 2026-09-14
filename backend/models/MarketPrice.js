import mongoose from 'mongoose';

const marketPriceSchema = new mongoose.Schema(
  {
    crop: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
    },
    variety: {
      type: String,
      required: [true, 'Crop variety is required'],
      trim: true,
    },
    marketName: {
      type: String,
      required: [true, 'Market name is required'],
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    minPricePerKg: {
      type: Number,
      required: [true, 'Minimum price per kg is required'],
      min: [0, 'Minimum price cannot be negative'],
    },
    maxPricePerKg: {
      type: Number,
      required: [true, 'Maximum price per kg is required'],
      min: [0, 'Maximum price cannot be negative'],
    },
    modalPricePerKg: {
      type: Number,
      required: [true, 'Modal price per kg is required'],
      min: [0, 'Modal price cannot be negative'],
    },
    distanceKm: {
      type: Number,
      required: [true, 'Distance in km is required'],
      min: [0, 'Distance cannot be negative'],
    },
    transportCost: {
      type: Number,
      required: [true, 'Transport cost is required'],
      min: [0, 'Transport cost cannot be negative'],
    },
    marketFee: {
      type: Number,
      required: [true, 'Market fee is required'],
      min: [0, 'Market fee cannot be negative'],
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
    priceDate: {
      type: Date,
      required: [true, 'Price date is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Validation: minimum price ≤ modal price ≤ maximum price
marketPriceSchema.pre('validate', function (next) {
  if (
    this.minPricePerKg > this.modalPricePerKg ||
    this.modalPricePerKg > this.maxPricePerKg ||
    this.minPricePerKg > this.maxPricePerKg
  ) {
    this.invalidate(
      'modalPricePerKg',
      'Prices must follow: min ≤ modal ≤ max'
    );
  }
  next();
});

// Prevent duplicate records for the same crop, market, and date
marketPriceSchema.index({ crop: 1, marketName: 1, priceDate: 1 }, { unique: true });

const MarketPrice = mongoose.model('MarketPrice', marketPriceSchema);

export default MarketPrice;
