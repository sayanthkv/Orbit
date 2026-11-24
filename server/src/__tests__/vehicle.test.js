const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateFullTank,
  calculateMileageTest,
  calculateTripCost,
  processFuelEntriesMileage,
  validateOdometer,
} = require('../utils/mileageCalc');

describe('Vehicle Log Mileage & Calculator Unit Tests', () => {
  describe('Full-Tank Calculator (Tool A)', () => {
    it('should compute cost to fill an empty tank and estimated full range', () => {
      const result = calculateFullTank({
        tankCapacity: 45, // 45 litres
        fuelPrice: 102.5, // 102.50 INR/L
        averageMileage: 18, // 18 km/L
        currentFuelPercentage: 20, // 20% remaining
      });

      assert.equal(result.costToFillEmpty, 4612.5); // 45 * 102.5
      assert.equal(result.estimatedFullRange, 810); // 45 * 18
      assert.equal(result.costPerKm, 5.69); // 102.5 / 18 = 5.694
      assert.equal(result.costPer100Km, 569.44);
      assert.equal(result.fuelNeededToTopUp, 36); // 45 * 0.8
      assert.equal(result.costToTopUp, 3690); // 36 * 102.5
      assert.equal(result.remainingRange, 162); // 45 * 0.2 * 18
    });
  });

  describe('Mileage Tester (Tool B)', () => {
    it('should compute actual mileage from full-to-full odometer readings', () => {
      const result = calculateMileageTest({
        mode: 'full_to_full',
        lastOdometer: 10000,
        currentOdometer: 10450, // 450 km travelled
        fuelUsed: 25, // 25 litres to top up
        fuelPrice: 100,
        vehicleAverageMileage: 16,
      });

      assert.equal(result.distance, 450);
      assert.equal(result.mileage, 18); // 450 / 25
      assert.equal(result.costPerKm, 5.56); // 2500 / 450
      assert.equal(result.totalCost, 2500);
      assert.equal(result.comparisonPercent, 13); // (18 - 16) / 16 = 12.5% -> 13%
      assert.equal(result.rating, 'Excellent');
    });

    it('should throw an error if current odometer is lower than previous odometer', () => {
      assert.throws(
        () =>
          calculateMileageTest({
            mode: 'full_to_full',
            lastOdometer: 10000,
            currentOdometer: 9500,
            fuelUsed: 20,
          }),
        /Current odometer cannot be lower/
      );
    });
  });

  describe('Trip Cost Estimator (Tool C)', () => {
    it('should calculate fuel needed, total cost, tank fills, and passenger split', () => {
      const result = calculateTripCost({
        distance: 300,
        averageMileage: 15,
        fuelPrice: 100,
        tankCapacity: 40,
        isRoundTrip: true, // 600 km
        passengerCount: 4,
      });

      assert.equal(result.totalDistance, 600);
      assert.equal(result.fuelNeeded, 40); // 600 / 15
      assert.equal(result.tripCost, 4000); // 40 * 100
      assert.equal(result.tankFills, 1); // 40 / 40
      assert.equal(result.costPerPerson, 1000); // 4000 / 4
    });
  });

  describe('Full-to-Full Mileage Sequence with Missed/Partial Fills', () => {
    it('should correctly handle intermediate partial fills between full-tank entries', () => {
      const entries = [
        {
          date: '2026-01-01',
          odometer: 1000,
          litres: 40,
          totalAmount: 4000,
          isFullTank: true,
        },
        {
          date: '2026-01-05',
          odometer: 1300,
          litres: 10,
          totalAmount: 1000,
          isFullTank: false, // partial fill
        },
        {
          date: '2026-01-10',
          odometer: 1800,
          litres: 30,
          totalAmount: 3000,
          isFullTank: true, // full tank
        },
      ];

      const processed = processFuelEntriesMileage(entries);
      // processed is in reverse order (newest first)
      const newestFull = processed[0]; // 2026-01-10
      const partial = processed[1]; // 2026-01-05
      const baseline = processed[2]; // 2026-01-01

      // Baseline has no prior entry, so mileage is null
      assert.equal(baseline.mileage, null);

      // Partial fill cannot compute standalone mileage
      assert.equal(partial.isPartial, true);
      assert.equal(partial.mileage, null);

      // Newest full tank spans 1800 - 1000 = 800 km, with total litres = 10 + 30 = 40 litres
      assert.equal(newestFull.isPartial, false);
      assert.equal(newestFull.distanceSinceLastFill, 800);
      assert.equal(newestFull.mileage, 20); // 800 / 40 = 20 km/L
      assert.equal(newestFull.costPerKm, 5); // (1000 + 3000) / 800 = 5 INR/km
    });
  });

  describe('Odometer Validation', () => {
    it('should validate odometer monotonicity', () => {
      const validCheck = validateOdometer(12500, 12000);
      assert.equal(validCheck.valid, true);

      const invalidCheck = validateOdometer(11800, 12000);
      assert.equal(invalidCheck.valid, false);
      assert.match(invalidCheck.message, /cannot be lower/);
    });
  });
});
