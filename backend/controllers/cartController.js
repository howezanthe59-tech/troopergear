const db = require('../db');
const { normalizeProductImage } = require('../utils/normalizeProductImage');

exports.getCart = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ci.id, ci.quantity, ci.variant_color, ci.variant_size,
              p.id AS product_id, p.name, p.category, p.price, p.image, p.badge
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?
       ORDER BY ci.id DESC`,
      [req.user.id]
    );
    return res.json((rows || []).map(r => ({ ...r, image: normalizeProductImage(r.image) })));
  } catch (err) {
    console.error('Get cart error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity, variantColor, variantSize } = req.body || {};
    const qty = Number(quantity || 1);
    if (!productId || qty < 1) {
      return res.status(400).json({ error: 'productId and quantity are required' });
    }
    const [productRows] = await db.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (productRows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const [existing] = await db.query(
      `SELECT id, quantity FROM cart_items 
       WHERE user_id = ? AND product_id = ? AND IFNULL(variant_color, '') = IFNULL(?, '') AND IFNULL(variant_size, '') = IFNULL(?, '')`,
      [req.user.id, productId, variantColor || '', variantSize || '']
    );
    if (existing.length > 0) {
      const newQty = existing[0].quantity + qty;
      await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
      const [rows] = await db.query('SELECT * FROM cart_items WHERE id = ?', [existing[0].id]);
      return res.status(200).json(rows[0]);
    }
    const [result] = await db.query(
      'INSERT INTO cart_items (user_id, product_id, quantity, variant_color, variant_size) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, productId, qty, variantColor || null, variantSize || null]
    );
    const [rows] = await db.query('SELECT * FROM cart_items WHERE id = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Add to cart error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body || {};
    const qty = Number(quantity);
    if (!qty || qty < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }
    const [existing] = await db.query('SELECT id FROM cart_items WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Cart item not found' });
    await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [qty, id]);
    const [rows] = await db.query('SELECT * FROM cart_items WHERE id = ?', [id]);
    return res.json(rows[0]);
  } catch (err) {
    console.error('Update cart item error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT id FROM cart_items WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Cart item not found' });
    await db.query('DELETE FROM cart_items WHERE id = ?', [id]);
    return res.json({ message: 'Item removed' });
  } catch (err) {
    console.error('Remove cart item error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await db.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    return res.json({ message: 'Cart cleared' });
  } catch (err) {
    console.error('Clear cart error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};
