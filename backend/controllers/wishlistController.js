const db = require('../db');
const { normalizeProductImage } = require('../utils/normalizeProductImage');

exports.getWishlist = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT w.id, w.created_at, p.id AS product_id, p.name, p.category, p.price, p.image, p.badge
       FROM wishlists w
       JOIN products p ON p.id = w.product_id
       WHERE w.user_id = ?
       ORDER BY w.id DESC`,
      [req.user.id]
    );
    return res.json((rows || []).map(r => ({ ...r, image: normalizeProductImage(r.image) })));
  } catch (err) {
    console.error('Get wishlist error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body || {};
    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }
    const [productRows] = await db.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (productRows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const [existing] = await db.query(
      'SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );
    if (existing.length > 0) {
      return res.status(200).json({ message: 'Already in wishlist' });
    }
    const [result] = await db.query(
      'INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)',
      [req.user.id, productId]
    );
    const [rows] = await db.query('SELECT * FROM wishlists WHERE id = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Add to wishlist error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT id FROM wishlists WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Wishlist item not found' });
    await db.query('DELETE FROM wishlists WHERE id = ?', [id]);
    return res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    console.error('Remove wishlist error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.clearWishlist = async (req, res) => {
  try {
    await db.query('DELETE FROM wishlists WHERE user_id = ?', [req.user.id]);
    return res.json({ message: 'Wishlist cleared' });
  } catch (err) {
    console.error('Clear wishlist error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};
