const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const FuelEntry = require('../models/FuelEntry');
const FuelPrice = require('../models/FuelPrice');
const ServiceEntry = require('../models/ServiceEntry');
const VehicleDocument = require('../models/VehicleDocument');
const ServiceInterval = require('../models/ServiceInterval');
const VehicleAlertDismissal = require('../models/VehicleAlertDismissal');
const Transaction = require('../models/Transaction');
const CashTransaction = require('../models/CashTransaction');
const mileageCalc = require('../utils/mileageCalc');

// Helper to link expense to Expense Tracker
async function linkVehicleExpense(userId, { amount, note, source, accountId, tag = '#vehicle' }) {
  if (!amount || amount <= 0 || !source) return null;
  try {
    if (source === 'cash') {
      const cashTx = await CashTransaction.create({
        user: userId,
        type: 'expense',
        amount: Number(amount),
        category: 'Transportation',
        date: new Date(),
        note: note || 'Vehicle expense',
        tags: [tag, '#vehicle'],
      });
      return { id: cashTx._id, source: 'cash' };
    } else if (accountId && mongoose.Types.ObjectId.isValid(accountId)) {
      const bankTx = await Transaction.create({
        user: userId,
        account: accountId,
        type: 'expense',
        amount: Number(amount),
        category: 'Transportation',
        date: new Date(),
        note: note || 'Vehicle expense',
        tags: [tag, '#vehicle'],
      });
      return { id: bankTx._id, source: 'account' };
    }
  } catch (err) {
    console.error('Error linking vehicle expense:', err);
  }
  return null;
}

// ---------------- VEHICLES CRUD ----------------

exports.listVehicles = async (req, res, next) => {
  try {
    const { includeArchived = 'false' } = req.query;
    const filter = { user: req.user._id };
    if (includeArchived !== 'true') {
      filter.isArchived = false;
    }

    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });

    // Compute active count and stats summary
    const totalVehicles = await Vehicle.countDocuments({ user: req.user._id });
    const activeVehicles = vehicles.filter((v) => !v.isArchived).length;

    res.status(200).json({
      success: true,
      data: {
        vehicles,
        totalVehicles,
        activeVehicles,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createVehicle = async (req, res, next) => {
  try {
    const {
      nickname,
      type,
      make,
      model,
      year,
      registrationNumber,
      fuelType,
      tankCapacity,
      currentOdometer,
      purchaseDate,
      photo,
      notes,
    } = req.body;

    if (!nickname || !make || !model || !registrationNumber || !tankCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: nickname, make, model, registration number, and tank capacity.',
      });
    }

    const vehicle = await Vehicle.create({
      user: req.user._id,
      nickname,
      type: type || 'car',
      make,
      model,
      year: year ? Number(year) : undefined,
      registrationNumber: registrationNumber.toUpperCase().trim(),
      fuelType: fuelType || 'petrol',
      tankCapacity: Number(tankCapacity),
      currentOdometer: Number(currentOdometer) || 0,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      photo: photo || null,
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: `${vehicle.nickname} added successfully!`,
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

exports.getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid vehicle ID' });
    }

    const vehicle = await Vehicle.findOne({ _id: id, user: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Aggregate lifetime fuel stats
    const fuelEntries = await FuelEntry.find({ vehicle: vehicle._id }).sort({ odometer: 1 });
    let totalFuelSpent = 0;
    let totalFuelLitres = 0;
    const computedMileages = [];

    fuelEntries.forEach((entry) => {
      totalFuelSpent += entry.totalAmount || 0;
      totalFuelLitres += entry.litres || 0;
      if (entry.mileage && entry.mileage > 0) {
        computedMileages.push(entry.mileage);
      }
    });

    const averageMileage =
      computedMileages.length > 0
        ? Math.round((computedMileages.reduce((a, b) => a + b, 0) / computedMileages.length) * 10) / 10
        : 0;

    const totalDistance =
      fuelEntries.length > 1
        ? fuelEntries[fuelEntries.length - 1].odometer - fuelEntries[0].odometer
        : 0;

    const costPerKm =
      totalDistance > 0 && totalFuelSpent > 0
        ? Math.round((totalFuelSpent / totalDistance) * 100) / 100
        : 0;

    // Upcoming service and document expiries
    const nextService = await ServiceEntry.findOne({
      vehicle: vehicle._id,
      $or: [
        { nextDueOdometer: { $gte: vehicle.currentOdometer } },
        { nextDueDate: { $gte: new Date() } },
      ],
    }).sort({ nextDueOdometer: 1, nextDueDate: 1 });

    const upcomingDocs = await VehicleDocument.find({
      $or: [{ vehicle: vehicle._id }, { isUserLevel: true, user: req.user._id }],
      expiryDate: { $gte: new Date() },
    })
      .sort({ expiryDate: 1 })
      .limit(3);

    res.status(200).json({
      success: true,
      data: {
        vehicle,
        stats: {
          averageMileage,
          totalFuelSpent: Math.round(totalFuelSpent),
          totalFuelLitres: Math.round(totalFuelLitres * 10) / 10,
          totalDistance,
          costPerKm,
          totalFills: fuelEntries.length,
        },
        nextService,
        upcomingDocs,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.status(200).json({
      success: true,
      message: `${vehicle.nickname} updated successfully!`,
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

exports.archiveVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findOne({ _id: id, user: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    vehicle.isArchived = !vehicle.isArchived;
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: vehicle.isArchived ? `${vehicle.nickname} archived` : `${vehicle.nickname} restored`,
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findOneAndDelete({ _id: id, user: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Cascade delete related records
    await Promise.all([
      FuelEntry.deleteMany({ vehicle: id }),
      ServiceEntry.deleteMany({ vehicle: id }),
      VehicleDocument.deleteMany({ vehicle: id }),
      ServiceInterval.deleteMany({ vehicle: id }),
      VehicleAlertDismissal.deleteMany({ vehicle: id }),
    ]);

    res.status(200).json({
      success: true,
      message: `${vehicle.nickname} and all related logs were deleted.`,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------- MILEAGE CALCULATIONS (STATELESS) ----------------

exports.calcMileage = (req, res) => {
  try {
    const { type = 'full_tank', payload = {} } = req.body;

    if (type === 'full_tank') {
      const result = mileageCalc.calculateFullTank(payload);
      return res.status(200).json({ success: true, data: result });
    }

    if (type === 'mileage_test') {
      const result = mileageCalc.calculateMileageTest(payload);
      return res.status(200).json({ success: true, data: result });
    }

    if (type === 'trip_cost') {
      const result = mileageCalc.calculateTripCost(payload);
      return res.status(200).json({ success: true, data: result });
    }

    return res.status(400).json({ success: false, message: 'Invalid calculation type' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ---------------- FUEL PRICES & HISTORY ----------------

exports.getFuelPrices = async (req, res, next) => {
  try {
    const { fuelType = 'petrol' } = req.query;

    const latest = await FuelPrice.findOne({ user: req.user._id, fuelType })
      .sort({ date: -1 });

    const history = await FuelPrice.find({ user: req.user._id, fuelType })
      .sort({ date: -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      data: {
        latestPrice: latest ? latest.pricePerLitre : null,
        history,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.saveFuelPrice = async (req, res, next) => {
  try {
    const { fuelType = 'petrol', pricePerLitre, date = new Date() } = req.body;
    if (!pricePerLitre || Number(pricePerLitre) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid fuel rate is required' });
    }

    const price = await FuelPrice.create({
      user: req.user._id,
      fuelType,
      pricePerLitre: Number(pricePerLitre),
      date: new Date(date),
    });

    res.status(201).json({
      success: true,
      message: 'Fuel rate updated',
      data: price,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------- FUEL ENTRIES (LOG) ----------------

exports.getFuelEntries = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const entries = await FuelEntry.find({ vehicle: vehicleId, user: req.user._id })
      .sort({ odometer: -1, date: -1 });

    res.status(200).json({
      success: true,
      data: entries,
    });
  } catch (error) {
    next(error);
  }
};

exports.createFuelEntry = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const {
      date,
      odometer,
      litres,
      pricePerLitre,
      totalAmount,
      isFullTank = true,
      isPartial = false,
      stationName,
      note,
      receipt,
      alsoRecordExpense,
      expenseSource,
      expenseAccountId,
    } = req.body;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, user: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const numOdo = Number(odometer);
    const numLitres = Number(litres);
    const numPrice = Number(pricePerLitre);
    const numTotal = Number(totalAmount) || Math.round(numLitres * numPrice * 100) / 100;

    // Calculate full-to-full mileage against last full tank
    let computedMileage = null;
    let distanceSinceLastFill = 0;
    let costPerKm = null;

    if (isFullTank) {
      const prevEntries = await FuelEntry.find({ vehicle: vehicleId, user: req.user._id })
        .sort({ odometer: -1 });

      if (prevEntries.length > 0) {
        const lastFull = prevEntries.find((e) => e.isFullTank && e.odometer < numOdo);
        if (lastFull) {
          distanceSinceLastFill = numOdo - lastFull.odometer;
          if (distanceSinceLastFill > 0 && numLitres > 0) {
            computedMileage = Math.round((distanceSinceLastFill / numLitres) * 100) / 100;
            costPerKm = Math.round((numTotal / distanceSinceLastFill) * 100) / 100;
          }
        }
      }
    }

    // Optional link to Expense Tracker
    let linkedExpense = null;
    if (alsoRecordExpense) {
      linkedExpense = await linkVehicleExpense(req.user._id, {
        amount: numTotal,
        note: `Fuel for ${vehicle.nickname} (${numLitres}L at ₹${numPrice}/L)`,
        source: expenseSource,
        accountId: expenseAccountId,
        tag: '#fuel',
      });
    }

    const entry = await FuelEntry.create({
      user: req.user._id,
      vehicle: vehicle._id,
      date: date ? new Date(date) : new Date(),
      odometer: numOdo,
      litres: numLitres,
      pricePerLitre: numPrice,
      totalAmount: numTotal,
      isFullTank,
      isPartial,
      stationName: stationName || '',
      note: note || '',
      receipt: receipt || undefined,
      mileage: computedMileage,
      distanceSinceLastFill,
      costPerKm,
      linkedExpenseId: linkedExpense?.id || null,
      expenseSource: linkedExpense?.source || null,
    });

    // Update vehicle's current odometer if this entry is higher
    if (numOdo > (vehicle.currentOdometer || 0)) {
      vehicle.currentOdometer = numOdo;
      await vehicle.save();
    }

    // Auto-save today's rate in FuelPrice history
    await FuelPrice.create({
      user: req.user._id,
      fuelType: vehicle.fuelType,
      pricePerLitre: numPrice,
      date: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Fuel entry recorded successfully!',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteFuelEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const entry = await FuelEntry.findOneAndDelete({ _id: id, user: req.user._id });
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Fuel entry not found' });
    }

    // Remove linked expense if any
    if (entry.linkedExpenseId) {
      if (entry.expenseSource === 'cash') {
        await CashTransaction.findByIdAndDelete(entry.linkedExpenseId);
      } else {
        await Transaction.findByIdAndDelete(entry.linkedExpenseId);
      }
    }

    res.status(200).json({ success: true, message: 'Fuel entry deleted' });
  } catch (error) {
    next(error);
  }
};

// ---------------- SERVICE LOG ----------------

exports.getServiceEntries = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const entries = await ServiceEntry.find({ vehicle: vehicleId, user: req.user._id })
      .sort({ date: -1, odometer: -1 });

    const intervals = await ServiceInterval.find({ vehicle: vehicleId, user: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        entries,
        intervals,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createServiceEntry = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const {
      date,
      odometer,
      serviceType = 'regular',
      workshop,
      cost,
      partsReplaced = [],
      notes,
      nextDueOdometer,
      nextDueDate,
      receipt,
      alsoRecordExpense,
      expenseSource,
      expenseAccountId,
    } = req.body;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, user: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const numCost = Number(cost) || 0;
    const numOdo = Number(odometer);

    let linkedExpense = null;
    if (alsoRecordExpense && numCost > 0) {
      linkedExpense = await linkVehicleExpense(req.user._id, {
        amount: numCost,
        note: `Service for ${vehicle.nickname} (${serviceType})`,
        source: expenseSource,
        accountId: expenseAccountId,
        tag: '#service',
      });
    }

    const entry = await ServiceEntry.create({
      user: req.user._id,
      vehicle: vehicle._id,
      date: date ? new Date(date) : new Date(),
      odometer: numOdo,
      serviceType,
      workshop: workshop || '',
      cost: numCost,
      partsReplaced: Array.isArray(partsReplaced) ? partsReplaced : [],
      notes: notes || '',
      nextDueOdometer: nextDueOdometer ? Number(nextDueOdometer) : null,
      nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
      receipt: receipt || undefined,
      linkedExpenseId: linkedExpense?.id || null,
      expenseSource: linkedExpense?.source || null,
    });

    if (numOdo > (vehicle.currentOdometer || 0)) {
      vehicle.currentOdometer = numOdo;
      await vehicle.save();
    }

    res.status(201).json({
      success: true,
      message: 'Service record logged successfully!',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------- DOCUMENTS & EXPIRIES ----------------

exports.getDocuments = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const filter = {
      user: req.user._id,
      $or: [{ vehicle: vehicleId }, { isUserLevel: true }],
    };

    const docs = await VehicleDocument.find(filter).sort({ expiryDate: 1 });

    const now = new Date();
    const enriched = docs.map((doc) => {
      const obj = doc.toObject();
      const diffDays = Math.ceil((new Date(doc.expiryDate) - now) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        obj.urgency = 'expired';
      } else if (diffDays <= 7) {
        obj.urgency = 'urgent';
      } else if (diffDays <= 30) {
        obj.urgency = 'warning';
      } else {
        obj.urgency = 'valid';
      }
      obj.daysRemaining = diffDays;
      return obj;
    });

    res.status(200).json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

exports.createDocument = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const {
      documentType,
      customName,
      policyNumber,
      issuer,
      issueDate,
      expiryDate,
      premiumAmount,
      insuredDeclaredValue,
      attachment,
      isUserLevel = false,
      alsoRecordExpense,
      expenseSource,
      expenseAccountId,
    } = req.body;

    const numPremium = Number(premiumAmount) || 0;
    let linkedExpense = null;

    if (alsoRecordExpense && numPremium > 0) {
      linkedExpense = await linkVehicleExpense(req.user._id, {
        amount: numPremium,
        note: `${documentType || customName} premium for vehicle`,
        source: expenseSource,
        accountId: expenseAccountId,
        tag: '#vehicle-doc',
      });
    }

    const doc = await VehicleDocument.create({
      user: req.user._id,
      vehicle: isUserLevel ? null : vehicleId,
      documentType,
      customName: customName || '',
      policyNumber: policyNumber || '',
      issuer: issuer || '',
      issueDate: issueDate ? new Date(issueDate) : null,
      expiryDate: new Date(expiryDate),
      premiumAmount: numPremium,
      insuredDeclaredValue: Number(insuredDeclaredValue) || 0,
      attachment: attachment || undefined,
      isUserLevel,
      linkedExpenseId: linkedExpense?.id || null,
      expenseSource: linkedExpense?.source || null,
    });

    res.status(201).json({
      success: true,
      message: 'Document saved successfully!',
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

exports.renewDocument = async (req, res, next) => {
  try {
    const { docId } = req.params;
    const { newExpiryDate, newPolicyNumber, newPremiumAmount, renewalNote } = req.body;

    const doc = await VehicleDocument.findOne({ _id: docId, user: req.user._id });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Push previous period to renewal history
    doc.renewalHistory.push({
      previousExpiryDate: doc.expiryDate,
      previousPolicyNumber: doc.policyNumber,
      renewedAt: new Date(),
      premiumPaid: Number(newPremiumAmount) || doc.premiumAmount,
      note: renewalNote || '',
    });

    doc.expiryDate = new Date(newExpiryDate);
    if (newPolicyNumber) doc.policyNumber = newPolicyNumber;
    if (newPremiumAmount) doc.premiumAmount = Number(newPremiumAmount);
    await doc.save();

    res.status(200).json({
      success: true,
      message: 'Document renewed successfully!',
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------- ALERTS & SNOOZE ----------------

exports.getAlerts = async (req, res, next) => {
  try {
    const now = new Date();
    const dismissals = await VehicleAlertDismissal.find({
      user: req.user._id,
      snoozedUntil: { $gte: now },
    });
    const snoozedAlertIds = new Set(dismissals.map((d) => d.alertId));

    const vehicles = await Vehicle.find({ user: req.user._id, isArchived: false });
    const alerts = [];

    for (const v of vehicles) {
      // 1. Documents Alert (expiry <= 30 days)
      const docs = await VehicleDocument.find({
        $or: [{ vehicle: v._id }, { isUserLevel: true, user: req.user._id }],
      });

      for (const d of docs) {
        const days = Math.ceil((new Date(d.expiryDate) - now) / (1000 * 60 * 60 * 24));
        const alertId = `doc_${d._id}_${d.expiryDate.toISOString().slice(0, 10)}`;

        if (!snoozedAlertIds.has(alertId) && days <= 30) {
          alerts.push({
            id: alertId,
            vehicleId: v._id,
            vehicleName: v.nickname,
            type: 'document_expiry',
            severity: days <= 0 ? 'critical' : days <= 7 ? 'urgent' : 'warning',
            title: `${d.customName || d.documentType.toUpperCase()} ${days <= 0 ? 'Expired' : 'Expiring Soon'}`,
            message:
              days <= 0
                ? `${d.customName || d.documentType} expired ${Math.abs(days)} day(s) ago!`
                : `${d.customName || d.documentType} expires in ${days} day(s).`,
            daysRemaining: days,
          });
        }
      }

      // 2. Service Due Alert
      const nextService = await ServiceEntry.findOne({
        vehicle: v._id,
        $or: [
          { nextDueOdometer: { $lte: v.currentOdometer + 300 } },
          { nextDueDate: { $lte: new Date(Date.now() + 15 * 86400000) } },
        ],
      }).sort({ nextDueOdometer: 1, nextDueDate: 1 });

      if (nextService) {
        const alertId = `service_${nextService._id}`;
        if (!snoozedAlertIds.has(alertId)) {
          const isOverdue =
            (nextService.nextDueOdometer && v.currentOdometer >= nextService.nextDueOdometer) ||
            (nextService.nextDueDate && now >= nextService.nextDueDate);

          alerts.push({
            id: alertId,
            vehicleId: v._id,
            vehicleName: v.nickname,
            type: 'service_due',
            severity: isOverdue ? 'critical' : 'warning',
            title: isOverdue ? 'Service Overdue' : 'Service Due Soon',
            message: `Scheduled maintenance due at ${nextService.nextDueOdometer || 'upcoming date'} km.`,
          });
        }
      }

      // 3. Stale Odometer Nudge (> 30 days without fuel or service entry)
      const lastFuel = await FuelEntry.findOne({ vehicle: v._id }).sort({ date: -1 });
      if (lastFuel) {
        const daysSinceFuel = Math.ceil((now - new Date(lastFuel.date)) / (1000 * 60 * 60 * 24));
        const alertId = `stale_odo_${v._id}`;
        if (daysSinceFuel >= 30 && !snoozedAlertIds.has(alertId)) {
          alerts.push({
            id: alertId,
            vehicleId: v._id,
            vehicleName: v.nickname,
            type: 'stale_odometer',
            severity: 'info',
            title: 'Update Odometer',
            message: `No fuel entry recorded for ${v.nickname} in over ${daysSinceFuel} days. Update your reading to keep calculations accurate.`,
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};

exports.dismissAlert = async (req, res, next) => {
  try {
    const { alertId, snoozeDays = 7 } = req.body;
    if (!alertId) {
      return res.status(400).json({ success: false, message: 'Alert ID is required' });
    }

    const snoozedUntil = new Date(Date.now() + Number(snoozeDays) * 86400000);

    await VehicleAlertDismissal.findOneAndUpdate(
      { user: req.user._id, alertId },
      { $set: { snoozedUntil, dismissedAt: new Date() } },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: `Alert snoozed for ${snoozeDays} days.` });
  } catch (error) {
    next(error);
  }
};

// ---------------- ANALYTICS & VEHICLE COMPARISON ----------------

exports.getAnalytics = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const vehicle = await Vehicle.findOne({ _id: vehicleId, user: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const [fuelEntries, serviceEntries, documents] = await Promise.all([
      FuelEntry.find({ vehicle: vehicleId, user: req.user._id }).sort({ odometer: 1 }),
      ServiceEntry.find({ vehicle: vehicleId, user: req.user._id }),
      VehicleDocument.find({ vehicle: vehicleId, user: req.user._id }),
    ]);

    const totalFuelCost = fuelEntries.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    const totalServiceCost = serviceEntries.reduce((acc, curr) => acc + (curr.cost || 0), 0);
    const totalDocCost = documents.reduce((acc, curr) => acc + (curr.premiumAmount || 0), 0);
    const totalOwnershipCost = Math.round(totalFuelCost + totalServiceCost + totalDocCost);

    const totalDistance =
      fuelEntries.length > 1
        ? fuelEntries[fuelEntries.length - 1].odometer - fuelEntries[0].odometer
        : 0;

    const runningCostPerKm =
      totalDistance > 0 ? Math.round((totalOwnershipCost / totalDistance) * 100) / 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        tco: {
          fuel: Math.round(totalFuelCost),
          service: Math.round(totalServiceCost),
          documents: Math.round(totalDocCost),
          total: totalOwnershipCost,
          totalDistance,
          runningCostPerKm,
        },
        fuelTrend: fuelEntries.map((e) => ({
          date: e.date,
          mileage: e.mileage,
          odometer: e.odometer,
          pricePerLitre: e.pricePerLitre,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
