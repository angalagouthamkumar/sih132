/**
 * syncAcceptedOffers.js
 * ---------------------
 * Development-only backfill script.
 * Finds accepted Offers that do not yet have a corresponding Order and creates one.
 * Adjusts crop quantity/status exactly once per offer.
 *
 * Idempotent: safe to run multiple times. Already-synced offers are skipped.
 *
 * Usage:
 *   npm run sync:orders
 *   (or: node scripts/syncAcceptedOffers.js)
 *
 * IMPORTANT: Never hardcodes credentials. Uses MONGODB_URL from .env (or falls back to local).
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import Offer from '../models/Offer.js';
import Order from '../models/Order.js';
import Crop from '../models/Crop.js';

const MONGO_URL =
  process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/sih26132';

const getMultiplierToKg = (unit) => {
  switch (unit?.toLowerCase()) {
    case 'tonne':   return 1000;
    case 'quintal': return 100;
    default:        return 1;
  }
};

async function syncAcceptedOffers() {
  console.log('[sync:orders] Connecting to MongoDB...');
  await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 5000 });
  console.log('[sync:orders] Connected.');

  // Find all accepted offers
  const acceptedOffers = await Offer.find({ status: 'accepted' })
    .populate('crop', 'name variety quantity unit status')
    .populate('farmer', 'name')
    .populate('buyer', 'name businessName');

  console.log(`[sync:orders] Found ${acceptedOffers.length} accepted offer(s).`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const offer of acceptedOffers) {
    try {
      // Check if order already exists for this offer
      const existingOrder = await Order.findOne({ offer: offer._id });
      if (existingOrder) {
        console.log(`  [SKIP] Offer ${offer._id} — order already exists (${existingOrder._id})`);
        skipped++;
        continue;
      }

      // Validate required references
      if (!offer.crop || !offer.farmer || !offer.buyer) {
        console.warn(`  [SKIP] Offer ${offer._id} — missing crop, farmer or buyer reference.`);
        skipped++;
        continue;
      }

      const crop = await Crop.findById(offer.crop._id);
      if (!crop) {
        console.warn(`  [SKIP] Offer ${offer._id} — crop ${offer.crop._id} not found.`);
        skipped++;
        continue;
      }

      // Build order document using snapshotted offer values
      const orderDoc = {
        offer: offer._id,
        crop: crop._id,
        farmer: offer.farmer._id,
        buyer: offer.buyer._id,
        cropName: crop.name,
        variety: crop.variety,
        quantity: offer.quantity,
        unit: offer.unit,
        offeredPricePerKg: offer.offeredPricePerKg,
        grossAmount: offer.grossAmount,
        transportCost: offer.transportCost || 0,
        otherCharges: offer.otherCharges || 0,
        netAmount: offer.netRealization,
        orderStatus: 'confirmed',
        paymentStatus: 'pending',
        statusHistory: [
          {
            status: 'confirmed',
            changedBy: offer.farmer._id,
            changedAt: offer.updatedAt || new Date(),
          },
        ],
      };

      await Order.create(orderDoc);
      console.log(`  [CREATE] Offer ${offer._id} → new Order for crop "${crop.name}"`);

      // Adjust crop quantity/status (only if not already sold)
      if (crop.status !== 'sold') {
        if (offer.quantity >= crop.quantity) {
          crop.quantity = 0;
          crop.status = 'sold';
        } else {
          crop.quantity = Math.round((crop.quantity - offer.quantity) * 1000) / 1000;
          // crop.status remains 'available'
        }
        await crop.save();
        console.log(`  [UPDATE] Crop "${crop.name}" → qty: ${crop.quantity} ${crop.unit}, status: ${crop.status}`);
      } else {
        console.log(`  [SKIP-CROP] Crop "${crop.name}" already marked as sold — no quantity update.`);
      }

      created++;
    } catch (err) {
      console.error(`  [ERROR] Offer ${offer._id}: ${err.message}`);
      failed++;
    }
  }

  console.log('\n[sync:orders] Summary:');
  console.log(`  Created: ${created}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Failed:  ${failed}`);

  await mongoose.disconnect();
  console.log('[sync:orders] Disconnected. Done.');
  process.exit(failed > 0 ? 1 : 0);
}

syncAcceptedOffers().catch((err) => {
  console.error('[sync:orders] Fatal error:', err.message);
  process.exit(1);
});
