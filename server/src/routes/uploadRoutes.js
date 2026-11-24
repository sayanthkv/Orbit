const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  upload,
  getUploadStatus,
  uploadReceipt,
  deleteReceipt,
} = require('../controllers/uploadController');

router.use(requireAuth);

router.get('/status', getUploadStatus);
router.post('/', upload.single('file'), uploadReceipt);
router.delete('/:publicId', deleteReceipt);

module.exports = router;
