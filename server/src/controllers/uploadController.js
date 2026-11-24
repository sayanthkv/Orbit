const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Memory storage for multer
const storage = multer.memoryStorage();

// File filter (jpg, png, webp, pdf, max 5MB)
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter,
});

// GET /api/uploads/status
const getUploadStatus = (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      enabled: isCloudinaryConfigured(),
    },
  });
};

// POST /api/uploads
const uploadReceipt = async (req, res, next) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Receipt attachments are currently disabled (Cloudinary credentials not set).',
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a file to upload' });
    }

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const isPdf = req.file.mimetype === 'application/pdf';
    const uploadOptions = {
      folder: 'orbit_receipts',
      resource_type: isPdf ? 'raw' : 'image',
    };

    const result = await cloudinary.uploader.upload(dataURI, uploadOptions);

    res.status(200).json({
      success: true,
      message: 'Receipt uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        fileType: isPdf ? 'pdf' : 'image',
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/uploads/:publicId
const deleteReceipt = async (req, res, next) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(200).json({ success: true, message: 'Cloudinary not configured' });
    }

    const { publicId } = req.params;
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }

    res.status(200).json({
      success: true,
      message: 'Receipt removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
  getUploadStatus,
  uploadReceipt,
  deleteReceipt,
};
