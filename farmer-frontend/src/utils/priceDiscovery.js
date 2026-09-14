/**
 * Pure calculation utility for Price Discovery & Net-Realization Ranking
 * Strictly mathematical and transparent — no ML, no AI, no live price guarantees.
 */

// Convert any supported agricultural unit to kilograms
export const convertToKg = (quantity, unit) => {
  const q = Number(quantity) || 0;
  if (q <= 0) return 0;
  switch (unit?.toLowerCase()) {
    case 'tonne':
      return q * 1000;
    case 'quintal':
      return q * 100;
    case 'kg':
    default:
      return q * 1;
  }
};

// Round money to two decimal places
export const roundTwoDecimals = (val) => {
  const num = Number(val);
  if (isNaN(num)) return 0;
  return Math.round(num * 100) / 100;
};

/**
 * Evaluates a wholesale Mandi option for a given crop lot size
 */
export const evaluateMandiOption = (mandi, crop) => {
  const cropQuantityKg = convertToKg(crop?.quantity, crop?.unit);
  if (cropQuantityKg <= 0) {
    return {
      id: mandi.id,
      name: mandi.marketName,
      type: 'mandi',
      district: mandi.district,
      quantityKg: 0,
      quantityDisplay: `${crop?.quantity || 0} ${crop?.unit || 'kg'}`,
      pricePerKg: mandi.modalPricePerKg || 0,
      minPricePerKg: mandi.minPricePerKg || 0,
      maxPricePerKg: mandi.maxPricePerKg || 0,
      grossAmount: 0,
      transportCost: mandi.transportCost || 0,
      otherCharges: mandi.marketFee || 0,
      netRealization: 0,
      netPerKg: 0,
      distanceKm: mandi.distanceKm || 0,
      demand: mandi.demand || 'medium',
      trend: mandi.trend || 'stable',
      lastUpdated: mandi.lastUpdated,
      raw: mandi,
    };
  }

  const modalPrice = Number(mandi.modalPricePerKg) || 0;
  const transport = Number(mandi.transportCost) || 0;
  const marketFee = Number(mandi.marketFee) || 0;

  const grossAmount = roundTwoDecimals(modalPrice * cropQuantityKg);
  const netRealization = roundTwoDecimals(grossAmount - transport - marketFee);
  const netPerKg = roundTwoDecimals(netRealization / cropQuantityKg);

  return {
    id: mandi.id,
    name: mandi.marketName,
    type: 'mandi',
    district: mandi.district,
    quantityKg: cropQuantityKg,
    quantityDisplay: `${crop.quantity} ${crop.unit}`,
    pricePerKg: modalPrice,
    minPricePerKg: mandi.minPricePerKg,
    maxPricePerKg: mandi.maxPricePerKg,
    grossAmount,
    transportCost: transport,
    otherCharges: marketFee,
    netRealization,
    netPerKg,
    distanceKm: mandi.distanceKm,
    demand: mandi.demand,
    trend: mandi.trend,
    lastUpdated: mandi.lastUpdated,
    raw: mandi,
  };
};

/**
 * Evaluates a Buyer Offer using the server-calculated net realization
 */
export const evaluateBuyerOffer = (offer) => {
  const offerQuantityKg = convertToKg(offer?.quantity, offer?.unit);
  const serverNet = Number(offer?.netRealization) || 0;
  const gross = Number(offer?.grossAmount) || 0;
  const transport = Number(offer?.transportCost) || 0;
  const other = Number(offer?.otherCharges) || 0;
  const pricePerKg = Number(offer?.offeredPricePerKg) || 0;

  const netPerKg =
    offerQuantityKg > 0 ? roundTwoDecimals(serverNet / offerQuantityKg) : 0;

  const buyerTitle =
    offer.buyer?.businessName ||
    offer.buyer?.name ||
    offer.buyerCompany ||
    offer.buyerName ||
    'Commercial Agribusiness Buyer';

  return {
    id: offer._id || offer.id,
    name: buyerTitle,
    type: 'buyer',
    district: offer.buyer?.location || offer.location || 'Buyer Farm-Gate Pickup',
    quantityKg: offerQuantityKg,
    quantityDisplay: `${offer.quantity} ${offer.unit}`,
    pricePerKg,
    grossAmount: roundTwoDecimals(gross),
    transportCost: roundTwoDecimals(transport),
    otherCharges: roundTwoDecimals(other),
    netRealization: roundTwoDecimals(serverNet), // Server authoritative
    netPerKg,
    message: offer.message || offer.notes || '',
    status: offer.status || 'pending',
    createdAt: offer.createdAt || offer.date,
    raw: offer,
  };
};

/**
 * Combines, ranks, and compares Mandi options with Buyer offers for a selected crop
 */
export const compareMarketAndOffers = (crop, mandiRecords = [], buyerOffers = []) => {
  if (!crop) {
    return {
      rankedOptions: [],
      recommendedOption: null,
      secondBestOption: null,
      netDifferencePerKg: 0,
      totalDifference: 0,
      explanation: 'No crop selected for price comparison.',
      breakdown: null,
    };
  }

  // 1. Evaluate all matching mandi records
  const evaluatedMandis = mandiRecords.map((m) => evaluateMandiOption(m, crop));

  // 2. Evaluate all valid pending buyer offers for this crop
  const evaluatedOffers = buyerOffers
    .filter((o) => {
      // Offer must belong to this crop and be pending
      const cropIdMatch =
        o.crop?._id === crop._id ||
        o.crop === crop._id ||
        (o.crop?.name && o.crop.name.toLowerCase() === crop.name.toLowerCase());
      return cropIdMatch && (o.status === 'pending' || !o.status);
    })
    .map((o) => evaluateBuyerOffer(o));

  // 3. Combine options
  const allOptions = [...evaluatedOffers, ...evaluatedMandis];

  if (allOptions.length === 0) {
    return {
      rankedOptions: [],
      recommendedOption: null,
      secondBestOption: null,
      netDifferencePerKg: 0,
      totalDifference: 0,
      explanation: 'No matching mandi benchmark or buyer offers found for this crop.',
      breakdown: null,
    };
  }

  // 4. Primary rank: netPerKg DESCENDING. Tie-breaker: netRealization DESCENDING.
  allOptions.sort((a, b) => {
    if (b.netPerKg !== a.netPerKg) {
      return b.netPerKg - a.netPerKg;
    }
    return b.netRealization - a.netRealization;
  });

  // Assign 1-based ranks
  const rankedOptions = allOptions.map((opt, idx) => ({
    ...opt,
    rank: idx + 1,
  }));

  const recommendedOption = rankedOptions[0];
  const secondBestOption = rankedOptions.length > 1 ? rankedOptions[1] : null;

  let netDifferencePerKg = 0;
  let totalDifference = 0;
  let explanation = '';

  if (secondBestOption) {
    netDifferencePerKg = roundTwoDecimals(
      recommendedOption.netPerKg - secondBestOption.netPerKg
    );
    totalDifference = roundTwoDecimals(
      recommendedOption.netRealization - secondBestOption.netRealization
    );

    const diffFormatted = netDifferencePerKg.toFixed(2);
    if (netDifferencePerKg > 0) {
      explanation = `Recommended because this option provides ₹${diffFormatted} more per kg after estimated transport and other charges.`;
    } else {
      explanation = `Recommended because this option provides an equivalent rate of ₹${recommendedOption.netPerKg.toFixed(2)}/kg with optimal logistics terms.`;
    }
  } else {
    explanation = `Recommended as the only available procurement benchmark for this harvest lot at ₹${recommendedOption.netPerKg.toFixed(2)}/kg.`;
  }

  const breakdown = {
    cropName: crop.name,
    cropQuantity: `${crop.quantity} ${crop.unit}`,
    cropQuantityKg: convertToKg(crop.quantity, crop.unit),
    recommended: {
      name: recommendedOption.name,
      type: recommendedOption.type,
      pricePerKg: recommendedOption.pricePerKg,
      grossAmount: recommendedOption.grossAmount,
      deductions: roundTwoDecimals(recommendedOption.transportCost + recommendedOption.otherCharges),
      netRealization: recommendedOption.netRealization,
      netPerKg: recommendedOption.netPerKg,
    },
    formula: 'Net Per Kg = (Gross Amount - Transport Cost - Other Charges) / Quantity in kg',
  };

  return {
    rankedOptions,
    recommendedOption,
    secondBestOption,
    netDifferencePerKg,
    totalDifference,
    explanation,
    breakdown,
  };
};
