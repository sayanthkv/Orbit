/**
 * Pure calculation utilities for vehicle mileage, full-tank metrics, and trip costs.
 * Stateless and unit-tested to guarantee consistency across server and client.
 */

/**
 * Tool A: Calculate full-tank costs and estimated range
 */
function calculateFullTank({
  tankCapacity = 0,
  fuelPrice = 0,
  averageMileage = 0,
  currentFuelPercentage = 0,
}) {
  const cap = Math.max(0, Number(tankCapacity) || 0);
  const price = Math.max(0, Number(fuelPrice) || 0);
  const mileage = Math.max(0, Number(averageMileage) || 0);
  const fuelPct = Math.min(100, Math.max(0, Number(currentFuelPercentage) || 0));

  const costToFillEmpty = cap * price;
  const estimatedFullRange = cap * mileage;
  const costPerKm = mileage > 0 ? price / mileage : 0;
  const costPer100Km = costPerKm * 100;

  const fuelNeededToTopUp = cap * ((100 - fuelPct) / 100);
  const costToTopUp = fuelNeededToTopUp * price;
  const remainingRange = cap * (fuelPct / 100) * mileage;

  return {
    tankCapacity: cap,
    fuelPrice: price,
    averageMileage: mileage,
    currentFuelPercentage: fuelPct,
    costToFillEmpty: Math.round(costToFillEmpty * 100) / 100,
    estimatedFullRange: Math.round(estimatedFullRange * 10) / 10,
    costPerKm: Math.round(costPerKm * 100) / 100,
    costPer100Km: Math.round(costPer100Km * 100) / 100,
    fuelNeededToTopUp: Math.round(fuelNeededToTopUp * 100) / 100,
    costToTopUp: Math.round(costToTopUp * 100) / 100,
    remainingRange: Math.round(remainingRange * 10) / 10,
  };
}

/**
 * Tool B: Mileage Tester (actual mileage from odometer reading or distance)
 */
function calculateMileageTest({
  mode = 'full_to_full', // 'full_to_full' | 'partial'
  lastOdometer = 0,
  currentOdometer = 0,
  distance = 0,
  fuelUsed = 0,
  fuelPrice = 0,
  vehicleAverageMileage = 0,
}) {
  let travelDistance = 0;
  const litres = Math.max(0, Number(fuelUsed) || 0);
  const price = Math.max(0, Number(fuelPrice) || 0);
  const avg = Math.max(0, Number(vehicleAverageMileage) || 0);

  if (mode === 'full_to_full') {
    const lastOdo = Number(lastOdometer) || 0;
    const currOdo = Number(currentOdometer) || 0;
    if (currOdo < lastOdo) {
      throw new Error('Current odometer cannot be lower than the previous odometer reading.');
    }
    travelDistance = currOdo - lastOdo;
  } else {
    travelDistance = Math.max(0, Number(distance) || 0);
  }

  const calculatedMileage = litres > 0 ? travelDistance / litres : 0;
  const costPerKm = travelDistance > 0 && price > 0 ? (litres * price) / travelDistance : 0;
  const totalCost = litres * price;

  let comparisonPercent = 0;
  let rating = 'Standard';
  if (avg > 0 && calculatedMileage > 0) {
    comparisonPercent = Math.round(((calculatedMileage - avg) / avg) * 100);
    if (comparisonPercent >= 10) rating = 'Excellent';
    else if (comparisonPercent >= 0) rating = 'Above Average';
    else if (comparisonPercent >= -10) rating = 'Average';
    else rating = 'Below Average';
  }

  return {
    mode,
    distance: travelDistance,
    fuelUsed: litres,
    fuelPrice: price,
    mileage: Math.round(calculatedMileage * 100) / 100,
    costPerKm: Math.round(costPerKm * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    comparisonPercent,
    rating,
  };
}

/**
 * Tool C: Trip Cost Estimator
 */
function calculateTripCost({
  distance = 0,
  averageMileage = 0,
  fuelPrice = 0,
  tankCapacity = 0,
  isRoundTrip = false,
  passengerCount = 1,
}) {
  const baseDist = Math.max(0, Number(distance) || 0);
  const totalDist = isRoundTrip ? baseDist * 2 : baseDist;
  const mileage = Math.max(0, Number(averageMileage) || 0);
  const price = Math.max(0, Number(fuelPrice) || 0);
  const cap = Math.max(0, Number(tankCapacity) || 0);
  const passengers = Math.max(1, Number(passengerCount) || 1);

  const fuelNeeded = mileage > 0 ? totalDist / mileage : 0;
  const tripCost = fuelNeeded * price;
  const tankFills = cap > 0 ? fuelNeeded / cap : 0;
  const costPerPerson = tripCost / passengers;

  return {
    distance: baseDist,
    totalDistance: totalDist,
    isRoundTrip,
    passengerCount: passengers,
    fuelNeeded: Math.round(fuelNeeded * 100) / 100,
    tripCost: Math.round(tripCost * 100) / 100,
    tankFills: Math.round(tankFills * 10) / 10,
    costPerPerson: Math.round(costPerPerson * 100) / 100,
  };
}

/**
 * Compute full-to-full mileage across an array of fuel entries.
 * Handles missed/partial fills correctly:
 * - Only consecutive full-tank entries produce a direct mileage figure.
 * - If there are partial entries between two full-tank fills, intermediate litres are summed.
 * - Flags entries that cannot be calculated as partial.
 */
function processFuelEntriesMileage(entries = []) {
  if (!entries || entries.length === 0) return [];

  // Sort ascending by date and odometer
  const sorted = [...entries].sort((a, b) => {
    const dateDiff = new Date(a.date) - new Date(b.date);
    if (dateDiff !== 0) return dateDiff;
    return (Number(a.odometer) || 0) - (Number(b.odometer) || 0);
  });

  let lastFullIndex = -1;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const isFull = Boolean(current.isFullTank);

    if (isFull) {
      if (lastFullIndex === -1) {
        // First full tank fill: serves as the baseline starting point
        current.mileage = null;
        current.costPerKm = null;
        current.isPartial = false;
        current.distanceSinceLastFill = 0;
        lastFullIndex = i;
      } else {
        const prevFull = sorted[lastFullIndex];
        const dist = (Number(current.odometer) || 0) - (Number(prevFull.odometer) || 0);

        if (dist <= 0) {
          current.mileage = null;
          current.costPerKm = null;
          current.isPartial = true;
          current.distanceSinceLastFill = 0;
        } else {
          // Sum current litres plus any partial fills in between
          let totalLitres = Number(current.litres) || 0;
          let totalCost = Number(current.totalAmount) || 0;

          for (let j = lastFullIndex + 1; j < i; j++) {
            totalLitres += Number(sorted[j].litres) || 0;
            totalCost += Number(sorted[j].totalAmount) || 0;
          }

          if (totalLitres > 0) {
            current.mileage = Math.round((dist / totalLitres) * 100) / 100;
            current.costPerKm = Math.round((totalCost / dist) * 100) / 100;
            current.distanceSinceLastFill = dist;
            current.isPartial = false;
          } else {
            current.mileage = null;
            current.costPerKm = null;
            current.isPartial = true;
          }
        }
        lastFullIndex = i;
      }
    } else {
      // Partial fill: cannot calculate mileage individually
      current.mileage = null;
      current.costPerKm = null;
      current.isPartial = true;
      current.distanceSinceLastFill = 0;
    }
  }

  // Return in descending order (newest first)
  return sorted.reverse();
}

/**
 * Validate odometer reading against existing vehicle odometer history
 */
function validateOdometer(newOdometer, currentVehicleOdometer) {
  const newOdo = Number(newOdometer);
  const currOdo = Number(currentVehicleOdometer);

  if (isNaN(newOdo) || newOdo < 0) {
    return { valid: false, message: 'Odometer must be a valid non-negative number.' };
  }
  if (!isNaN(currOdo) && currOdo > 0 && newOdo < currOdo) {
    return {
      valid: false,
      message: `Odometer reading (${newOdo} km) cannot be lower than the vehicle's current recorded odometer (${currOdo} km).`,
    };
  }
  return { valid: true };
}

module.exports = {
  calculateFullTank,
  calculateMileageTest,
  calculateTripCost,
  processFuelEntriesMileage,
  validateOdometer,
};
