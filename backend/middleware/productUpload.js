const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const uploadsRoot = path.join(__dirname, '..', 'uploads');
const productUploadsDir = path.join(uploadsRoot, 'products');

function ensureUploadDirs() {
  fs.mkdirSync(productUploadsDir, { recursive: true });
}

function fileExtFor(originalname) {
  const ext = path.extname(originalname || '').toLowerCase();
  return ext || '';
}

function isAllowedImageExt(ext) {
  return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
}

ensureUploadDirs();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDirs();
    cb(null, productUploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = fileExtFor(file.originalname);
    const safeExt = isAllowedImageExt(ext) ? ext : '';
    const name = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${safeExt}`;
    cb(null, name);
  }
});

function fileFilter(req, file, cb) {
  const ext = fileExtFor(file.originalname);
  if (!isAllowedImageExt(ext)) {
    return cb(new Error('Only .jpg, .jpeg, .png, and .webp images are allowed'));
  }
  const mime = String(file.mimetype || '').toLowerCase();
  if (!mime.startsWith('image/')) {
    return cb(new Error('Only image uploads are allowed'));
  }
  return cb(null, true);
}

const productImageUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

module.exports = {
  productImageUpload,
  productUploadsDir
};

