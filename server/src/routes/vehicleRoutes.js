const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Vehicle CRUD
router.get('/', vehicleController.listVehicles);
router.post('/', vehicleController.createVehicle);
router.get('/alerts', vehicleController.getAlerts);
router.post('/alerts/dismiss', vehicleController.dismissAlert);

// Stateless mileage calculation endpoint
router.post('/mileage/calc', vehicleController.calcMileage);

// Fuel prices history
router.get('/fuel-prices', vehicleController.getFuelPrices);
router.post('/fuel-prices', vehicleController.saveFuelPrice);

// Single Vehicle details & operations
router.get('/:id', vehicleController.getVehicleById);
router.put('/:id', vehicleController.updateVehicle);
router.delete('/:id', vehicleController.deleteVehicle);
router.patch('/:id/archive', vehicleController.archiveVehicle);
router.get('/:vehicleId/analytics', vehicleController.getAnalytics);

// Vehicle Fuel Log
router.get('/:vehicleId/fuel', vehicleController.getFuelEntries);
router.post('/:vehicleId/fuel', vehicleController.createFuelEntry);
router.delete('/:vehicleId/fuel/:id', vehicleController.deleteFuelEntry);

// Vehicle Service Log
router.get('/:vehicleId/services', vehicleController.getServiceEntries);
router.post('/:vehicleId/services', vehicleController.createServiceEntry);

// Vehicle Documents
router.get('/:vehicleId/documents', vehicleController.getDocuments);
router.post('/:vehicleId/documents', vehicleController.createDocument);
router.put('/documents/:docId/renew', vehicleController.renewDocument);

module.exports = router;
