import Crop from '../models/Crop.js';
import Requirement from '../models/Requirement.js';
import TransportConfig from '../models/TransportConfig.js';
import { calculateDistance } from '../utils/distance.js';

export const getMatchesForFarmer = async (req, res) => {
  try {
    const farmerId = req.user.id || req.user._id;

    // Get farmer's active crops
    const farmerCrops = await Crop.find({ farmer: farmerId, status: 'available' }).populate('farmer');

    if (farmerCrops.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [], message: 'Add crops to see matches.' });
    }

    // Get active requirements
    const activeRequirements = await Requirement.find({ status: 'active' }).populate('buyer');

    const config = await TransportConfig.findOne();

    const matches = [];

    for (const crop of farmerCrops) {
      for (const reqObj of activeRequirements) {
        // Crop name must match closely
        if (crop.name.toLowerCase() !== reqObj.cropName.toLowerCase()) continue;

        let matchScore = 0;
        let matchingFactors = [];
        let missingFactors = [];

        // Check variety
        if (crop.variety.toLowerCase() === reqObj.variety.toLowerCase()) {
          matchScore += 30;
          matchingFactors.push('Exact variety match');
        } else {
          missingFactors.push('Different variety');
        }

        // Check quantity (convert to kg for comparison)
        const getMultiplier = (unit) => (unit === 'tonne' ? 1000 : unit === 'quintal' ? 100 : 1);
        const cropQtyKg = crop.quantity * getMultiplier(crop.unit);
        const reqQtyKg = reqObj.quantity * getMultiplier(reqObj.unit);

        if (cropQtyKg >= reqQtyKg) {
          matchScore += 20;
          matchingFactors.push('Sufficient quantity available');
        } else {
          missingFactors.push('Quantity available is less than required');
        }

        // Check Distance and Dynamic Transport
        let distanceKm = null;
        let transportCost = null;
        let transportAvailable = false;

        const hasCoords =
          crop.farmer?.latitude != null &&
          crop.farmer?.longitude != null &&
          reqObj.buyer?.latitude != null &&
          reqObj.buyer?.longitude != null;

        if (config && hasCoords) {
          distanceKm = calculateDistance(
            crop.farmer.latitude,
            crop.farmer.longitude,
            reqObj.buyer.latitude,
            reqObj.buyer.longitude
          );
          transportCost = Math.round((config.baseCharge + distanceKm * config.ratePerKm) * 100) / 100;
          transportAvailable = true;

          if (distanceKm <= 50) {
            matchScore += 20;
            matchingFactors.push('Within 50km');
          } else if (distanceKm <= 200) {
            matchScore += 10;
            matchingFactors.push('Within 200km');
          }
        } else {
          missingFactors.push('Transport estimate unavailable');
        }

        // Calculate Net Realization
        const targetGrossAmount = reqObj.targetPricePerKg * reqQtyKg;
        const actualDeduction = transportAvailable ? transportCost : 0;
        const netRealization = targetGrossAmount - actualDeduction;
        const netPerKg = netRealization / reqQtyKg;

        if (netPerKg >= crop.expectedPricePerKg) {
          matchScore += 30;
          matchingFactors.push('Expected price met');
        } else {
          missingFactors.push(
            `Net realization (₹${Math.round(netPerKg)}/kg) is below your expected price (₹${crop.expectedPricePerKg}/kg)`
          );
        }

        if (matchScore >= 30) {
          matches.push({
            crop: { _id: crop._id, name: crop.name, variety: crop.variety },
            requirement: {
              _id: reqObj._id,
              buyer: reqObj.buyer?.businessName || reqObj.buyer?.name || 'Buyer',
              quantity: reqObj.quantity,
              unit: reqObj.unit,
              targetPrice: reqObj.targetPricePerKg,
            },
            matchScore,
            matchingFactors,
            missingFactors,
            distanceKm,
            transportAvailable,
            transportCost: transportAvailable ? Math.round(transportCost) : null,
            netRealization: Math.round(netRealization),
            netPerKg: Math.round(netPerKg * 100) / 100,
          });
        }
      }
    }

    // Sort primarily by net realization per kg, then by match score
    matches.sort((a, b) => b.netPerKg - a.netPerKg || b.matchScore - a.matchScore);

    return res.status(200).json({ success: true, count: matches.length, data: matches });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMatchesForBuyer = async (req, res) => {
  try {
    const buyerId = req.user.id || req.user._id;

    const buyerRequirements = await Requirement.find({ buyer: buyerId, status: 'active' }).populate('buyer');

    if (buyerRequirements.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [], message: 'Post requirements to see matches.' });
    }

    const availableCrops = await Crop.find({ status: 'available' }).populate('farmer');
    const config = await TransportConfig.findOne();

    const matches = [];

    for (const reqObj of buyerRequirements) {
      for (const crop of availableCrops) {
        if (crop.name.toLowerCase() !== reqObj.cropName.toLowerCase()) continue;

        let matchScore = 0;
        let matchingFactors = [];
        let missingFactors = [];

        if (crop.variety.toLowerCase() === reqObj.variety.toLowerCase()) {
          matchScore += 30;
          matchingFactors.push('Exact variety match');
        } else {
          missingFactors.push('Different variety');
        }

        const getMultiplier = (unit) => (unit === 'tonne' ? 1000 : unit === 'quintal' ? 100 : 1);
        const cropQtyKg = crop.quantity * getMultiplier(crop.unit);
        const reqQtyKg = reqObj.quantity * getMultiplier(reqObj.unit);

        if (cropQtyKg >= reqQtyKg) {
          matchScore += 20;
          matchingFactors.push('Farmer has sufficient quantity');
        } else {
          missingFactors.push('Farmer quantity is less than required');
        }

        let distanceKm = null;
        let transportCost = null;
        let transportAvailable = false;

        const hasCoords =
          crop.farmer?.latitude != null &&
          crop.farmer?.longitude != null &&
          reqObj.buyer?.latitude != null &&
          reqObj.buyer?.longitude != null;

        if (config && hasCoords) {
          distanceKm = calculateDistance(
            crop.farmer.latitude,
            crop.farmer.longitude,
            reqObj.buyer.latitude,
            reqObj.buyer.longitude
          );
          transportCost = Math.round((config.baseCharge + distanceKm * config.ratePerKm) * 100) / 100;
          transportAvailable = true;

          if (distanceKm <= 50) {
            matchScore += 20;
            matchingFactors.push('Within 50km');
          } else if (distanceKm <= 200) {
            matchScore += 10;
            matchingFactors.push('Within 200km');
          }
        } else {
          missingFactors.push('Transport estimate unavailable');
        }

        const grossAmount = crop.expectedPricePerKg * reqQtyKg;
        const totalCostToBuyer = grossAmount + (transportAvailable ? transportCost : 0);
        const totalCostPerKg = totalCostToBuyer / reqQtyKg;

        if (totalCostPerKg <= reqObj.targetPricePerKg) {
          matchScore += 30;
          matchingFactors.push('Within target budget');
        } else {
          missingFactors.push(
            `Total landed cost (₹${Math.round(totalCostPerKg)}/kg) exceeds target price (₹${reqObj.targetPricePerKg}/kg)`
          );
        }

        if (matchScore >= 30) {
          matches.push({
            requirement: { _id: reqObj._id, cropName: reqObj.cropName, variety: reqObj.variety },
            crop: {
              _id: crop._id,
              farmer: crop.farmer?.name || 'Farmer',
              quantity: crop.quantity,
              unit: crop.unit,
              expectedPrice: crop.expectedPricePerKg,
            },
            matchScore,
            matchingFactors,
            missingFactors,
            distanceKm,
            transportAvailable,
            transportCost: transportAvailable ? Math.round(transportCost) : null,
            totalCostToBuyer: Math.round(totalCostToBuyer),
            totalCostPerKg: Math.round(totalCostPerKg * 100) / 100,
          });
        }
      }
    }

    matches.sort((a, b) => a.totalCostPerKg - b.totalCostPerKg || b.matchScore - a.matchScore);

    return res.status(200).json({ success: true, count: matches.length, data: matches });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
