const db = require('../db');
const { normalizeProductImage } = require('../utils/normalizeProductImage');

exports.createOrderFromCart = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [cartRows] = await conn.query(
      `SELECT ci.id, ci.quantity, ci.variant_color, ci.variant_size, p.id AS product_id, p.price
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?`,
      [req.user.id]
    );
    if (cartRows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: 'Cart is empty' });
    }
    const total = cartRows.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const [orderResult] = await conn.query(
      'INSERT INTO orders (user_id, status, total) VALUES (?, ?, ?)',
      [req.user.id, 'processing', total]
    );
    const orderId = orderResult.insertId;
    for (const item of cartRows) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, variant_color, variant_size)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price, item.variant_color || null, item.variant_size || null]
      );
    }
    await conn.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    await conn.commit();
    conn.release();
    const [orderRows] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    return res.status(201).json(orderRows[0]);
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('Create order error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC',
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('Get orders error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.getOrderItems = async (req, res) => {
  try {
    const { id } = req.params;
    const [orderRows] = await db.query('SELECT id FROM orders WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (orderRows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const [rows] = await db.query(
      `SELECT oi.id, oi.quantity, oi.price, oi.variant_color, oi.variant_size, 
              p.name, p.category, p.image
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [id]
    );
    return res.json((rows || []).map(r => ({ ...r, image: normalizeProductImage(r.image) })));
  } catch (err) {
    console.error('Get order items error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.adminGetAllOrders = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
          o.id,
          o.user_id,
          o.status,
          o.total,
          o.created_at,
          u.name AS user_name,
          u.email AS user_email,
          COALESCE(
            GROUP_CONCAT(CONCAT(p.name, ' x', oi.quantity) ORDER BY oi.id SEPARATOR ', '),
            ''
          ) AS items_purchased
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON p.id = oi.product_id
       GROUP BY o.id, o.user_id, o.status, o.total, o.created_at, u.name, u.email
       ORDER BY o.id DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('Admin get orders error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.adminUpdateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ error: 'Status is required' });
    const [existing] = await db.query('SELECT id FROM orders WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Order not found' });
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    return res.json(rows[0]);
  } catch (err) {
    console.error('Admin update order error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};
