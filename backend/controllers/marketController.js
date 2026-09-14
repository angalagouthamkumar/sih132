import MarketPrice from '../models/MarketPrice.js';
import Requirement from '../models/Requirement.js';
import { escapeRegex } from '../utils/regex.js';

export const getMarketData = async (req, res) => {
  try {
    const { crop, district, search } = req.query;

    let query = {};

    if (crop && typeof crop === 'string' && crop.trim()) {
      const sanitizedCrop = escapeRegex(crop.trim());
      const cropQuery = new RegExp(sanitizedCrop, 'i');
      query.$or = [{ crop: cropQuery }, { variety: cropQuery }];
    }

    if (district && typeof district === 'string' && district.trim()) {
      const sanitizedDistrict = escapeRegex(district.trim());
      query.district = new RegExp(sanitizedDistrict, 'i');
    }

    if (search && typeof search === 'string' && search.trim()) {
      const sanitizedSearch = escapeRegex(search.trim());
      const q = new RegExp(sanitizedSearch, 'i');
      if (query.$or) {
        query = {
          $and: [
            query,
            { $or: [{ crop: q }, { variety: q }, { marketName: q }, { district: q }] },
          ],
        };
      } else {
        query.$or = [{ crop: q }, { variety: q }, { marketName: q }, { district: q }];
      }
    }

    // Get all records sorted by date descending, then crop ascending
    const allRecords = await MarketPrice.find(query).sort({ priceDate: -1, crop: 1 });

    // Group by crop + market to calculate trend and only return the latest
    const grouped = {};
    allRecords.forEach((record) => {
      const key = `${record.crop}-${record.marketName}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(record);
    });

    const enrichedMarkets = await Promise.all(
      Object.values(grouped).map(async (records) => {
        const latest = records[0].toObject();

        // Calculate Trend
        let trend = 'insufficient data';
        if (records.length >= 2) {
          const previous = records[1];
          if (latest.modalPricePerKg > previous.modalPricePerKg) trend = 'rising';
          else if (latest.modalPricePerKg < previous.modalPricePerKg) trend = 'falling';
          else trend = 'stable';
        }

        // Calculate Demand from active requirements
        const sanitizedCropName = escapeRegex(latest.crop);
        const activeReqs = await Requirement.find({
          cropName: new RegExp(`^${sanitizedCropName}$`, 'i'),
          status: 'active',
        });

        let totalRequiredKg = 0;
        activeReqs.forEach((reqItem) => {
          let qty = reqItem.quantity;
          if (reqItem.unit === 'quintal') qty *= 100;
          if (reqItem.unit === 'tonne') qty *= 1000;
          totalRequiredKg += qty;
        });

        let demand = 'no data';
        if (totalRequiredKg > 5000) demand = 'high';
        else if (totalRequiredKg >= 1000) demand = 'medium';
        else if (totalRequiredKg > 0) demand = 'low';

        return {
          ...latest,
          trend,
          demand,
          source: 'Platform market records',
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        markets: enrichedMarkets,
        count: enrichedMarkets.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving market benchmark data.',
    });
  }
};
