import mongoose from 'mongoose';

const transportConfigSchema = new mongoose.Schema(
  {
    ratePerKm: {
      type: Number,
      required: true,
      min: 0,
    },
    baseCharge: {
      type: Number,
      required: true,
      min: 0,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

// We only ever need one transport config document
const TransportConfig = mongoose.model('TransportConfig', transportConfigSchema);

export default TransportConfig;
