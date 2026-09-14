import mongoose from 'mongoose';
import Requirement from '../models/Requirement.js';
import { escapeRegex } from '../utils/regex.js';

export const createRequirement = async (req, res) => {
  try {
    const {
      cropName,
      variety,
      quantity,
      unit,
      targetPricePerKg,
      deliveryLocation,
      latitude,
      longitude,
      requiredDate,
      qualityNotes,
    } = req.body;

    // Field-level validations
    if (!cropName || typeof cropName !== 'string' || !cropName.trim()) {
      return res.status(400).json({ success: false, message: 'Crop name is required.' });
    }
    if (!variety || typeof variety !== 'string' || !variety.trim()) {
      return res.status(400).json({ success: false, message: 'Variety is required.' });
    }

    const parsedQuantity = Number(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be greater than 0.' });
    }

    const parsedPrice = Number(targetPricePerKg);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Target price per kg must be greater than 0.' });
    }

    if (!deliveryLocation || typeof deliveryLocation !== 'string' || !deliveryLocation.trim()) {
      return res.status(400).json({ success: false, message: 'Delivery location is required.' });
    }

    if (!requiredDate) {
      return res.status(400).json({ success: false, message: 'Required delivery date is required.' });
    }

    const parsedDate = new Date(requiredDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid required delivery date.' });
    }

    const validUnits = ['kg', 'quintal', 'tonne'];
    const chosenUnit = unit ? unit.toLowerCase().trim() : 'kg';
    if (!validUnits.includes(chosenUnit)) {
      return res.status(400).json({ success: false, message: `Invalid unit. Supported: ${validUnits.join(', ')}` });
    }

    // Explicitly whitelist created fields - buyer is strictly from req.user
    const requirement = await Requirement.create({
      buyer: req.user._id || req.user.id,
      cropName: cropName.trim(),
      variety: variety.trim(),
      quantity: parsedQuantity,
      unit: chosenUnit,
      targetPricePerKg: parsedPrice,
      deliveryLocation: deliveryLocation.trim(),
      latitude: latitude !== undefined && !isNaN(Number(latitude)) ? Number(latitude) : undefined,
      longitude: longitude !== undefined && !isNaN(Number(longitude)) ? Number(longitude) : undefined,
      requiredDate: parsedDate,
      qualityNotes: qualityNotes ? String(qualityNotes).trim() : '',
      status: 'active',
    });

    return res.status(201).json({ success: true, data: requirement });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyRequirements = async (req, res) => {
  try {
    const buyerId = req.user._id || req.user.id;
    const requirements = await Requirement.find({ buyer: buyerId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: requirements.length, data: requirements });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllRequirements = async (req, res) => {
  try {
    const query = req.user.role === 'farmer' ? { status: 'active' } : {};

    if (req.query.crop && typeof req.query.crop === 'string' && req.query.crop.trim()) {
      query.cropName = new RegExp(escapeRegex(req.query.crop.trim()), 'i');
    }

    const requirements = await Requirement.find(query)
      .populate('buyer', 'name businessName location')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: requirements.length, data: requirements });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getRequirementById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Requirement not found. Invalid ID format.' });
    }

    const requirement = await Requirement.findById(id).populate('buyer', 'name businessName location');
    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found.' });
    }

    const buyerId = (requirement.buyer?._id || requirement.buyer).toString();
    const userId = (req.user._id || req.user.id).toString();

    // Access control: only owner or admin can view closed/fulfilled; farmer can view if active
    if (req.user.role === 'buyer' && buyerId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this requirement.' });
    }

    if (req.user.role === 'farmer' && requirement.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Requirement is no longer active.' });
    }

    return res.status(200).json({ success: true, data: requirement });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Requirement not found. Invalid ID format.' });
    }

    const requirement = await Requirement.findById(id);
    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found.' });
    }

    const buyerId = (requirement.buyer?._id || requirement.buyer).toString();
    const userId = (req.user._id || req.user.id).toString();

    if (buyerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this requirement.' });
    }

    // Whitelist update fields - NEVER allow changing requirement.buyer
    const updates = {};
    const {
      cropName,
      variety,
      quantity,
      unit,
      targetPricePerKg,
      deliveryLocation,
      latitude,
      longitude,
      requiredDate,
      qualityNotes,
      status,
    } = req.body;

    if (cropName !== undefined) {
      if (typeof cropName !== 'string' || !cropName.trim()) {
        return res.status(400).json({ success: false, message: 'Crop name cannot be empty.' });
      }
      updates.cropName = cropName.trim();
    }

    if (variety !== undefined) {
      if (typeof variety !== 'string' || !variety.trim()) {
        return res.status(400).json({ success: false, message: 'Variety cannot be empty.' });
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
      const chosenUnit = unit.toLowerCase().trim();
      if (!validUnits.includes(chosenUnit)) {
        return res.status(400).json({ success: false, message: `Invalid unit. Supported: ${validUnits.join(', ')}` });
      }
      updates.unit = chosenUnit;
    }

    if (targetPricePerKg !== undefined) {
      const parsedPrice = Number(targetPricePerKg);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ success: false, message: 'Target price must be greater than 0.' });
      }
      updates.targetPricePerKg = parsedPrice;
    }

    if (deliveryLocation !== undefined) {
      if (typeof deliveryLocation !== 'string' || !deliveryLocation.trim()) {
        return res.status(400).json({ success: false, message: 'Delivery location cannot be empty.' });
      }
      updates.deliveryLocation = deliveryLocation.trim();
    }

    if (latitude !== undefined) {
      updates.latitude = !isNaN(Number(latitude)) ? Number(latitude) : undefined;
    }

    if (longitude !== undefined) {
      updates.longitude = !isNaN(Number(longitude)) ? Number(longitude) : undefined;
    }

    if (requiredDate !== undefined) {
      const parsedDate = new Date(requiredDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid required delivery date.' });
      }
      updates.requiredDate = parsedDate;
    }

    if (qualityNotes !== undefined) {
      updates.qualityNotes = String(qualityNotes).trim();
    }

    if (status !== undefined) {
      const validStatuses = ['active', 'fulfilled', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status. Supported: ${validStatuses.join(', ')}` });
      }
      updates.status = status;
    }

    const updated = await Requirement.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate('buyer', 'name businessName location');

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Requirement not found. Invalid ID format.' });
    }

    const requirement = await Requirement.findById(id);
    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found.' });
    }

    const buyerId = (requirement.buyer?._id || requirement.buyer).toString();
    const userId = (req.user._id || req.user.id).toString();

    if (buyerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this requirement.' });
    }

    await requirement.deleteOne();
    return res.status(200).json({ success: true, message: 'Requirement deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
