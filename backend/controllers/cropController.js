import mongoose from 'mongoose';
import Crop from '../models/Crop.js';
import { escapeRegex } from '../utils/regex.js';

// @desc    Create a new crop listing
// @route   POST /api/crops
// @access  Private (Farmer only)
export const createCrop = async (req, res) => {
  try {
    const {
      name,
      variety,
      quantity,
      unit,
      expectedPricePerKg,
      location,
      harvestDate,
      imageUrl,
      description,
    } = req.body;

    // Field-level validations
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Crop name is required.',
      });
    }

    if (!variety || typeof variety !== 'string' || !variety.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Crop variety is required.',
      });
    }

    const parsedQuantity = Number(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number greater than 0.',
      });
    }

    const parsedPrice = Number(expectedPricePerKg);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Expected price per kg must be a positive number greater than 0.',
      });
    }

    const validUnits = ['kg', 'quintal', 'tonne'];
    const chosenUnit = unit ? unit.toLowerCase().trim() : 'kg';
    if (!validUnits.includes(chosenUnit)) {
      return res.status(400).json({
        success: false,
        message: `Invalid unit. Supported units: ${validUnits.join(', ')}`,
      });
    }

    if (!location || typeof location !== 'string' || !location.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Location is required.',
      });
    }

    if (!harvestDate) {
      return res.status(400).json({
        success: false,
        message: 'Harvest date is required.',
      });
    }

    const parsedDate = new Date(harvestDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid harvest date.',
      });
    }

    if (description && description.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Description cannot exceed 500 characters.',
      });
    }

    // Always assign authenticated farmer ID from token - never trust client payload
    const crop = await Crop.create({
      farmer: req.user._id,
      name: name.trim(),
      variety: variety.trim(),
      quantity: parsedQuantity,
      unit: chosenUnit,
      expectedPricePerKg: parsedPrice,
      location: location.trim(),
      harvestDate: parsedDate,
      imageUrl: imageUrl ? imageUrl.trim() : '',
      description: description ? description.trim() : '',
      status: 'available',
    });

    return res.status(201).json({
      success: true,
      message: 'Crop listing created successfully.',
      data: { crop },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error occurred while creating crop listing.',
    });
  }
};

// @desc    Get all crops owned by the authenticated farmer
// @route   GET /api/crops/mine
// @access  Private (Farmer only)
export const getMyCrops = async (req, res) => {
  try {
    const filter = { farmer: req.user._id };

    if (req.query.status && ['available', 'sold', 'inactive'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const crops = await Crop.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Farmer crops retrieved successfully.',
      data: {
        crops,
        count: crops.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving farmer crop listings.',
    });
  }
};

// @desc    Get public / marketplace crop listings
// @route   GET /api/crops
// @access  Private (Authenticated: farmer, buyer, admin)
export const getCrops = async (req, res) => {
  try {
    const filter = {};

    // By default, list only available crops unless requested otherwise
    if (req.query.status && ['available', 'sold', 'inactive', 'all'].includes(req.query.status)) {
      if (req.query.status !== 'all') {
        filter.status = req.query.status;
      }
    } else {
      filter.status = 'available';
    }

    if (req.query.search && typeof req.query.search === 'string' && req.query.search.trim()) {
      const searchRegex = new RegExp(escapeRegex(req.query.search.trim()), 'i');
      filter.$or = [{ name: searchRegex }, { variety: searchRegex }];
    }

    if (req.query.location && typeof req.query.location === 'string' && req.query.location.trim()) {
      filter.location = new RegExp(escapeRegex(req.query.location.trim()), 'i');
    }

    const crops = await Crop.find(filter)
      .populate('farmer', 'name location')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Crops retrieved successfully.',
      data: {
        crops,
        count: crops.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving crop listings.',
    });
  }
};

// @desc    Get single crop by ID
// @route   GET /api/crops/:id
// @access  Private (Authenticated)
export const getCropById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found. Invalid crop reference ID.',
      });
    }

    const crop = await Crop.findById(id).populate('farmer', 'name location');

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop listing not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: { crop },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving crop details.',
    });
  }
};

// @desc    Update crop listing (Owner only)
// @route   PATCH /api/crops/:id
// @access  Private (Farmer owner only)
export const updateCrop = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found. Invalid crop reference ID.',
      });
    }

    const crop = await Crop.findById(id);

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop listing not found.',
      });
    }

    // Ownership check: Must be the farmer who created the crop
    if (crop.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify crops that you own.',
      });
    }

    // Whitelist and validate incoming updates
    const updates = {};
    const {
      name,
      variety,
      quantity,
      unit,
      expectedPricePerKg,
      location,
      harvestDate,
      imageUrl,
      description,
      status,
    } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Crop name cannot be empty.' });
      }
      updates.name = name.trim();
    }

    if (variety !== undefined) {
      if (typeof variety !== 'string' || !variety.trim()) {
        return res.status(400).json({ success: false, message: 'Crop variety cannot be empty.' });
      }
      updates.variety = variety.trim();
    }

    if (quantity !== undefined) {
      const parsedQty = Number(quantity);
      if (isNaN(parsedQty) || parsedQty <= 0) {
        return res.status(400).json({ success: false, message: 'Quantity must be greater than 0.' });
      }
      updates.quantity = parsedQty;
    }

    if (unit !== undefined) {
      const validUnits = ['kg', 'quintal', 'tonne'];
      const normalizedUnit = unit.toLowerCase().trim();
      if (!validUnits.includes(normalizedUnit)) {
        return res.status(400).json({ success: false, message: `Invalid unit. Supported: ${validUnits.join(', ')}` });
      }
      updates.unit = normalizedUnit;
    }

    if (expectedPricePerKg !== undefined) {
      const parsedPrice = Number(expectedPricePerKg);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ success: false, message: 'Expected price per kg must be greater than 0.' });
      }
      updates.expectedPricePerKg = parsedPrice;
    }

    if (location !== undefined) {
      if (typeof location !== 'string' || !location.trim()) {
        return res.status(400).json({ success: false, message: 'Location cannot be empty.' });
      }
      updates.location = location.trim();
    }

    if (harvestDate !== undefined) {
      const parsedDate = new Date(harvestDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Please provide a valid harvest date.' });
      }
      updates.harvestDate = parsedDate;
    }

    if (imageUrl !== undefined) {
      updates.imageUrl = typeof imageUrl === 'string' ? imageUrl.trim() : '';
    }

    if (description !== undefined) {
      if (description && description.length > 500) {
        return res.status(400).json({ success: false, message: 'Description cannot exceed 500 characters.' });
      }
      updates.description = typeof description === 'string' ? description.trim() : '';
    }

    if (status !== undefined) {
      const validStatuses = ['available', 'sold', 'inactive'];
      const normalizedStatus = status.toLowerCase().trim();
      if (!validStatuses.includes(normalizedStatus)) {
        return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
      }
      updates.status = normalizedStatus;
    }

    // Apply updates
    Object.assign(crop, updates);
    await crop.save();

    return res.status(200).json({
      success: true,
      message: 'Crop listing updated successfully.',
      data: { crop },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error occurred while updating crop listing.',
    });
  }
};

// @desc    Delete crop listing permanently (Owner only)
// @route   DELETE /api/crops/:id
// @access  Private (Farmer owner only)
export const deleteCrop = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found. Invalid crop reference ID.',
      });
    }

    const crop = await Crop.findById(id);

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop listing not found.',
      });
    }

    // Ownership check: Must be the farmer who created the crop
    if (crop.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete crops that you own.',
      });
    }

    await Crop.deleteOne({ _id: crop._id });

    return res.status(200).json({
      success: true,
      message: 'Crop deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error occurred while deleting crop listing.',
    });
  }
};
