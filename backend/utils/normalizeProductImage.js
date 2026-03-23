const path = require('path');

function isHttpUrl(value) {
  return typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
}

function normalizeProductImage(imageValue) {
  if (!imageValue) return imageValue;
  const raw = String(imageValue).trim();
  if (!raw) return null;
  if (isHttpUrl(raw)) return raw;
  if (raw.startsWith('/uploads/')) return raw;
  if (raw.startsWith('uploads/')) return `/${raw}`;
  return `/uploads/products/${path.basename(raw)}`;
}

module.exports = { normalizeProductImage };

