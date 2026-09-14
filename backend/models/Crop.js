import mongoose from 'mongoose';

const cropSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
    },
    variety: {
      type: String,
      required: [true, 'Crop variety is required'],
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
        message: '{VALUE} is not a supported unit. Allowed: kg, quintal, tonne',
      },
      default: 'kg',
    },
    expectedPricePerKg: {
      type: Number,
      required: [true, 'Expected price per kg is required'],
      min: [0.01, 'Expected price per kg must be greater than 0'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    harvestDate: {
      type: Date,
      required: [true, 'Harvest date is required'],
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['available', 'sold', 'inactive'],
        message: '{VALUE} is not a valid status. Allowed: available, sold, inactive',
      },
      default: 'available',
    },
  },
  {
    timestamps: true,
  }
);

const Crop = mongoose.model('Crop', cropSchema);

export default Crop;
