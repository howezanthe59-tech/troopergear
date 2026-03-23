const db = require('../db');
const fs = require('fs');
const path = require('path');
const { productUploadsDir } = require('../middleware/productUpload');
const { normalizeProductImage } = require('../utils/normalizeProductImage');

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function toTrimmedString(value) {
  if (value === undefined || value === null) return null;
  return String(value).trim();
}

function toOptionalNullString(value) {
  const s = toTrimmedString(value);
  if (s === null) return null;
  return s.length === 0 ? null : s;
}

function toNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isLocalProductImage(imageValue) {
  return typeof imageValue === 'string' && imageValue.startsWith('/uploads/products/');
}

function localProductImageAbsPath(imageValue) {
  const file = path.basename(String(imageValue));
  return path.join(productUploadsDir, file);
}

function tryDeleteLocalProductImage(imageValue) {
  if (!isLocalProductImage(imageValue)) return;
  const abs = localProductImageAbsPath(imageValue);
  try {
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (_) {
    // best-effort
  }
}

function uploadedImagePath(req) {
  if (!req.file) return null;
  return `/uploads/products/${req.file.filename}`;
}

exports.getAllProducts = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products ORDER BY id DESC');
    res.json((rows || []).map(p => ({ ...p, image: normalizeProductImage(p.image) })));
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ ...rows[0], image: normalizeProductImage(rows[0].image) });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.createProduct = async (req, res) => {
  const newlyUploaded = uploadedImagePath(req);
  try {
    const body = req.body || {};
    const name = toTrimmedString(body.name);
    const category = toTrimmedString(body.category || body.type);
    const price = toNumber(body.price);
    const stock = toNumber(body.stock);
    const description = toOptionalNullString(body.description);
    const badge = toOptionalNullString(body.badge);
    const image = newlyUploaded || toOptionalNullString(body.image);

    if (!name || !category || price === null || stock === null) {
      return res.status(400).json({ error: 'Name, category, price, and stock are required' });
    }
    if (name.length > 150) return res.status(400).json({ error: 'Name is too long' });
    if (category.length > 120) return res.status(400).json({ error: 'Category is too long' });
    if (price <= 0) return res.status(400).json({ error: 'Price must be greater than 0' });
    if (!Number.isInteger(stock) || stock < 0) return res.status(400).json({ error: 'Stock must be a non-negative integer' });

    const [result] = await db.query(
      'INSERT INTO products (name, category, description, price, stock, badge, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, category, description, price, stock, badge, image]
    );
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating product:', err);
    tryDeleteLocalProductImage(newlyUploaded);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.updateProduct = async (req, res) => {
  const newlyUploaded = uploadedImagePath(req);
  try {
    const { id } = req.params;
    const [existingRows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (existingRows.length === 0) return res.status(404).json({ error: 'Product not found' });
    const existing = existingRows[0];

    const body = req.body || {};
    const updates = {};

    if (hasOwn(body, 'name')) {
      const name = toTrimmedString(body.name);
      if (!name) return res.status(400).json({ error: 'Name cannot be empty' });
      if (name.length > 150) return res.status(400).json({ error: 'Name is too long' });
      updates.name = name;
    }

    if (hasOwn(body, 'category') || hasOwn(body, 'type')) {
      const category = toTrimmedString(body.category || body.type);
      if (!category) return res.status(400).json({ error: 'Category cannot be empty' });
      if (category.length > 120) return res.status(400).json({ error: 'Category is too long' });
      updates.category = category;
    }

    if (hasOwn(body, 'description')) {
      updates.description = toOptionalNullString(body.description);
    }

    if (hasOwn(body, 'badge')) {
      updates.badge = toOptionalNullString(body.badge);
    }

    if (hasOwn(body, 'price')) {
      const price = toNumber(body.price);
      if (price === null) return res.status(400).json({ error: 'Price must be a number' });
      if (price <= 0) return res.status(400).json({ error: 'Price must be greater than 0' });
      updates.price = price;
    }

    if (hasOwn(body, 'stock')) {
      const stock = toNumber(body.stock);
      if (stock === null || !Number.isInteger(stock) || stock < 0) {
        return res.status(400).json({ error: 'Stock must be a non-negative integer' });
      }
      updates.stock = stock;
    }

    if (newlyUploaded) {
      updates.image = newlyUploaded;
    } else if (hasOwn(body, 'image')) {
      updates.image = toOptionalNullString(body.image);
    }

    const keys = Object.keys(updates);
    if (keys.length === 0) {
      return res.json(existing);
    }

    const setSql = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => updates[k]);
    values.push(id);

    await db.query(`UPDATE products SET ${setSql} WHERE id = ?`, values);

    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (newlyUploaded && existing.image && existing.image !== newlyUploaded) {
      tryDeleteLocalProductImage(existing.image);
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('Error updating product:', err);
    tryDeleteLocalProductImage(newlyUploaded);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const [existingRows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (existingRows.length === 0) return res.status(404).json({ error: 'Product not found' });
    const existing = existingRows[0];
    await db.query('DELETE FROM products WHERE id = ?', [id]);
    tryDeleteLocalProductImage(existing.image);
    return res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Error deleting product:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};
