const db = require('../db');

exports.getUsers = async (req, res) => {
  try {
    try {
      const [rows] = await db.query('SELECT id, name, email, phone_number, role, created_at FROM users ORDER BY id DESC');
      return res.json(rows);
    } catch (err) {
      if (err?.code !== 'ER_BAD_FIELD_ERROR') throw err;
      const [rows] = await db.query('SELECT id, name, email, role, created_at FROM users ORDER BY id DESC');
      return res.json((rows || []).map(r => ({ ...r, phone_number: null })));
    }
  } catch (err) {
    console.error('Get users error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    try {
      const [rows] = await db.query(
        `SELECT id, name, email, phone_number, created_at
         FROM users
         WHERE role = 'user'
         ORDER BY id DESC`
      );
      return res.json(rows);
    } catch (err) {
      if (err?.code !== 'ER_BAD_FIELD_ERROR') throw err;
      const [rows] = await db.query(
        `SELECT id, name, email, created_at
         FROM users
         WHERE role = 'user'
         ORDER BY id DESC`
      );
      return res.json((rows || []).map(r => ({ ...r, phone_number: null })));
    }
  } catch (err) {
    console.error('Get customers error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};
    if (!role) return res.status(400).json({ error: 'Role is required' });
    const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'User not found' });
    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    try {
      const [rows] = await db.query('SELECT id, name, email, phone_number, role, created_at FROM users WHERE id = ?', [id]);
      return res.json(rows[0]);
    } catch (err) {
      if (err?.code !== 'ER_BAD_FIELD_ERROR') throw err;
      const [rows] = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id]);
      return res.json({ ...(rows[0] || {}), phone_number: null });
    }
  } catch (err) {
    console.error('Update user role error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};
