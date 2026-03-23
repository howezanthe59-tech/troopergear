const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');

function isMissingTableError(err) {
  return err?.code === 'ER_NO_SUCH_TABLE';
}

async function ensureUserAddressesTable() {
  await db.query(
    `CREATE TABLE IF NOT EXISTS user_addresses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      street_address VARCHAR(190) NOT NULL,
      city VARCHAR(120) NOT NULL,
      parish_state VARCHAR(120) NOT NULL,
      country VARCHAR(120) NOT NULL,
      postal_code VARCHAR(30),
      is_default TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_addresses_user (user_id)
    )`
  );
}

async function ensureUserPaymentMethodsTable() {
  await db.query(
    `CREATE TABLE IF NOT EXISTS user_payment_methods (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      brand VARCHAR(30) NOT NULL,
      last4 CHAR(4) NOT NULL,
      exp_month TINYINT NOT NULL,
      exp_year SMALLINT NOT NULL,
      holder_name VARCHAR(120),
      token VARCHAR(120) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_payment_user (user_id),
      UNIQUE KEY uniq_payment_token (token)
    )`
  );
}

async function ensureUserCookieConsentsTable() {
  await db.query(
    `CREATE TABLE IF NOT EXISTS user_cookie_consents (
      user_id INT NOT NULL PRIMARY KEY,
      consent_version TINYINT NOT NULL DEFAULT 1,
      analytics TINYINT(1) NOT NULL DEFAULT 0,
      marketing TINYINT(1) NOT NULL DEFAULT 0,
      functional TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  );
}

async function ensureUserAccessibilityPreferencesTable() {
  await db.query(
    `CREATE TABLE IF NOT EXISTS user_accessibility_preferences (
      user_id INT NOT NULL PRIMARY KEY,
      prefs_version TINYINT NOT NULL DEFAULT 1,
      font_scale DECIMAL(4,2) NOT NULL DEFAULT 1.05,
      dyslexia_font TINYINT(1) NOT NULL DEFAULT 0,
      letter_spacing DECIMAL(4,2) NOT NULL DEFAULT 0.00,
      line_height DECIMAL(4,2) NOT NULL DEFAULT 1.60,
      dark_mode TINYINT(1) NOT NULL DEFAULT 0,
      high_contrast TINYINT(1) NOT NULL DEFAULT 0,
      invert_colors TINYINT(1) NOT NULL DEFAULT 0,
      highlight_links TINYINT(1) NOT NULL DEFAULT 0,
      focus_outline TINYINT(1) NOT NULL DEFAULT 0,
      reduce_motion TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  );
}

function consentRowToResponse(row) {
  const updated = row?.updated_at ? new Date(row.updated_at) : new Date();
  return {
    version: 1,
    preferences: {
      essential: true,
      analytics: Boolean(row.analytics),
      marketing: Boolean(row.marketing),
      functional: Boolean(row.functional)
    },
    updatedAt: updated.toISOString()
  };
}

function accessibilityRowToResponse(row) {
  const updated = row?.updated_at ? new Date(row.updated_at) : new Date();
  return {
    version: 1,
    preferences: {
      fontScale: Number(row.font_scale) || 1.05,
      dyslexiaFont: Boolean(row.dyslexia_font),
      letterSpacing: Number(row.letter_spacing) || 0,
      lineHeight: Number(row.line_height) || 1.6,
      darkMode: Boolean(row.dark_mode),
      highContrast: Boolean(row.high_contrast),
      invertColors: Boolean(row.invert_colors),
      highlightLinks: Boolean(row.highlight_links),
      focusOutline: Boolean(row.focus_outline),
      reduceMotion: Boolean(row.reduce_motion)
    },
    updatedAt: updated.toISOString()
  };
}

function isValidEmail(email) {
  const value = String(email || '').trim().toLowerCase();
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeDigits(value) {
  return String(value || '').replace(/\D+/g, '');
}

function cardBrandFromNumber(num) {
  const digits = normalizeDigits(num);
  if (!digits) return 'Card';
  if (/^4\d{12,18}$/.test(digits)) return 'Visa';
  if (/^(5[1-5]\d{14}|2(2[2-9]\d{12}|[3-6]\d{13}|7[01]\d{12}|720\d{12}))$/.test(digits)) return 'Mastercard';
  if (/^3[47]\d{13}$/.test(digits)) return 'American Express';
  if (/^6(?:011|5\d{2})\d{12}$/.test(digits)) return 'Discover';
  return 'Card';
}

exports.updateMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone_number, phoneNumber, phone } = req.body || {};
    const nextName = String(name || '').trim();
    const nextEmailRaw = String(email || '').trim().toLowerCase();
    const nextPhone = String((phone_number ?? phoneNumber ?? phone ?? '') || '').trim();

    if (!nextName) return res.status(400).json({ error: 'Full name is required' });
    if (!isValidEmail(nextEmailRaw)) return res.status(400).json({ error: 'A valid email is required' });
    if (nextPhone && nextPhone.length > 30) return res.status(400).json({ error: 'Phone number is too long' });

    const [existing] = await db.query('SELECT id FROM users WHERE email = ? AND id <> ?', [nextEmailRaw, userId]);
    if ((existing || []).length > 0) return res.status(409).json({ error: 'Email already in use' });

    try {
      await db.query(
        'UPDATE users SET name = ?, email = ?, phone_number = ? WHERE id = ?',
        [nextName, nextEmailRaw, nextPhone || null, userId]
      );
    } catch (err) {
      if (err?.code !== 'ER_BAD_FIELD_ERROR') throw err;
      await db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [nextName, nextEmailRaw, userId]);
    }

    const [rows] = await db.query('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);
    const user = rows?.[0];
    return res.json({ message: 'Profile updated', user: { ...user, phone_number: nextPhone || null } });
  } catch (err) {
    console.error('Update me error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body || {};
    const current = String(currentPassword || '');
    const next = String(newPassword || '');

    if (!current || !next) return res.status(400).json({ error: 'Current password and new password are required' });
    if (next.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
    if (next === current) return res.status(400).json({ error: 'New password must be different from current password' });

    const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (!rows?.length) return res.status(404).json({ error: 'User not found' });
    const ok = await bcrypt.compare(current, rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

    const passwordHash = await bcrypt.hash(next, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
    return res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('Update password error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.getCookieConsent = async (req, res) => {
  try {
    const userId = req.user.id;
    let rows;
    try {
      [rows] = await db.query(
        `SELECT consent_version, analytics, marketing, functional, updated_at
         FROM user_cookie_consents
         WHERE user_id = ?
         LIMIT 1`,
        [userId]
      );
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      await ensureUserCookieConsentsTable();
      [rows] = await db.query(
        `SELECT consent_version, analytics, marketing, functional, updated_at
         FROM user_cookie_consents
         WHERE user_id = ?
         LIMIT 1`,
        [userId]
      );
    }

    const row = rows?.[0];
    if (!row) return res.json({ consent: null });
    return res.json({ consent: consentRowToResponse(row) });
  } catch (err) {
    console.error('Get cookie consent error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.updateCookieConsent = async (req, res) => {
  try {
    const userId = req.user.id;
    const payload = req.body || {};
    const preferences = payload?.preferences || {};

    if (typeof preferences.analytics !== 'boolean') return res.status(400).json({ error: 'Invalid analytics preference' });
    if (typeof preferences.marketing !== 'boolean') return res.status(400).json({ error: 'Invalid marketing preference' });
    if (typeof preferences.functional !== 'boolean') return res.status(400).json({ error: 'Invalid functional preference' });

    const analytics = preferences.analytics ? 1 : 0;
    const marketing = preferences.marketing ? 1 : 0;
    const functional = preferences.functional ? 1 : 0;
    const consentVersion = Number(payload?.version) === 1 ? 1 : 1;

    try {
      await db.query(
        `INSERT INTO user_cookie_consents (user_id, consent_version, analytics, marketing, functional)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          consent_version = VALUES(consent_version),
          analytics = VALUES(analytics),
          marketing = VALUES(marketing),
          functional = VALUES(functional),
          updated_at = CURRENT_TIMESTAMP`,
        [userId, consentVersion, analytics, marketing, functional]
      );
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      await ensureUserCookieConsentsTable();
      await db.query(
        `INSERT INTO user_cookie_consents (user_id, consent_version, analytics, marketing, functional)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          consent_version = VALUES(consent_version),
          analytics = VALUES(analytics),
          marketing = VALUES(marketing),
          functional = VALUES(functional),
          updated_at = CURRENT_TIMESTAMP`,
        [userId, consentVersion, analytics, marketing, functional]
      );
    }

    const [rows] = await db.query(
      `SELECT consent_version, analytics, marketing, functional, updated_at
       FROM user_cookie_consents
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );
    const row = rows?.[0];
    return res.json({ consent: row ? consentRowToResponse(row) : null });
  } catch (err) {
    console.error('Update cookie consent error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.getAccessibilityPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    let rows;
    try {
      [rows] = await db.query(
        `SELECT prefs_version, font_scale, dyslexia_font, letter_spacing, line_height,
                dark_mode, high_contrast, invert_colors, highlight_links, focus_outline, reduce_motion, updated_at
         FROM user_accessibility_preferences
         WHERE user_id = ?
         LIMIT 1`,
        [userId]
      );
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      await ensureUserAccessibilityPreferencesTable();
      [rows] = await db.query(
        `SELECT prefs_version, font_scale, dyslexia_font, letter_spacing, line_height,
                dark_mode, high_contrast, invert_colors, highlight_links, focus_outline, reduce_motion, updated_at
         FROM user_accessibility_preferences
         WHERE user_id = ?
         LIMIT 1`,
        [userId]
      );
    }

    const row = rows?.[0];
    if (!row) return res.json({ accessibility: null });
    return res.json({ accessibility: accessibilityRowToResponse(row) });
  } catch (err) {
    console.error('Get accessibility preferences error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.updateAccessibilityPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const payload = req.body || {};
    const preferences = payload?.preferences || {};

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const fontScaleRaw = Number(preferences.fontScale);
    const letterSpacingRaw = Number(preferences.letterSpacing);
    const lineHeightRaw = Number(preferences.lineHeight);

    if (!Number.isFinite(fontScaleRaw)) return res.status(400).json({ error: 'Invalid font scale' });
    if (!Number.isFinite(letterSpacingRaw)) return res.status(400).json({ error: 'Invalid letter spacing' });
    if (!Number.isFinite(lineHeightRaw)) return res.status(400).json({ error: 'Invalid line height' });

    if (typeof preferences.dyslexiaFont !== 'boolean') return res.status(400).json({ error: 'Invalid dyslexia font toggle' });
    if (typeof preferences.darkMode !== 'boolean') return res.status(400).json({ error: 'Invalid dark mode toggle' });
    if (typeof preferences.highContrast !== 'boolean') return res.status(400).json({ error: 'Invalid high contrast toggle' });
    if (typeof preferences.invertColors !== 'boolean') return res.status(400).json({ error: 'Invalid invert colors toggle' });
    if (typeof preferences.highlightLinks !== 'boolean') return res.status(400).json({ error: 'Invalid highlight links toggle' });
    if (typeof preferences.focusOutline !== 'boolean') return res.status(400).json({ error: 'Invalid focus outline toggle' });
    if (typeof preferences.reduceMotion !== 'boolean') return res.status(400).json({ error: 'Invalid reduce motion toggle' });

    const fontScale = Number(clamp(fontScaleRaw, 0.85, 1.4).toFixed(2));
    const letterSpacing = Number(clamp(letterSpacingRaw, 0, 0.12).toFixed(2));
    const lineHeight = Number(clamp(lineHeightRaw, 1.2, 2.2).toFixed(2));

    const dyslexiaFont = preferences.dyslexiaFont ? 1 : 0;
    const darkMode = preferences.darkMode ? 1 : 0;
    const highContrast = preferences.highContrast ? 1 : 0;
    const invertColors = preferences.invertColors ? 1 : 0;
    const highlightLinks = preferences.highlightLinks ? 1 : 0;
    const focusOutline = preferences.focusOutline ? 1 : 0;
    const reduceMotion = preferences.reduceMotion ? 1 : 0;
    const prefsVersion = Number(payload?.version) === 1 ? 1 : 1;

    try {
      await db.query(
        `INSERT INTO user_accessibility_preferences
          (user_id, prefs_version, font_scale, dyslexia_font, letter_spacing, line_height,
           dark_mode, high_contrast, invert_colors, highlight_links, focus_outline, reduce_motion)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          prefs_version = VALUES(prefs_version),
          font_scale = VALUES(font_scale),
          dyslexia_font = VALUES(dyslexia_font),
          letter_spacing = VALUES(letter_spacing),
          line_height = VALUES(line_height),
          dark_mode = VALUES(dark_mode),
          high_contrast = VALUES(high_contrast),
          invert_colors = VALUES(invert_colors),
          highlight_links = VALUES(highlight_links),
          focus_outline = VALUES(focus_outline),
          reduce_motion = VALUES(reduce_motion),
          updated_at = CURRENT_TIMESTAMP`,
        [
          userId,
          prefsVersion,
          fontScale,
          dyslexiaFont,
          letterSpacing,
          lineHeight,
          darkMode,
          highContrast,
          invertColors,
          highlightLinks,
          focusOutline,
          reduceMotion
        ]
      );
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      await ensureUserAccessibilityPreferencesTable();
      await db.query(
        `INSERT INTO user_accessibility_preferences
          (user_id, prefs_version, font_scale, dyslexia_font, letter_spacing, line_height,
           dark_mode, high_contrast, invert_colors, highlight_links, focus_outline, reduce_motion)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          prefs_version = VALUES(prefs_version),
          font_scale = VALUES(font_scale),
          dyslexia_font = VALUES(dyslexia_font),
          letter_spacing = VALUES(letter_spacing),
          line_height = VALUES(line_height),
          dark_mode = VALUES(dark_mode),
          high_contrast = VALUES(high_contrast),
          invert_colors = VALUES(invert_colors),
          highlight_links = VALUES(highlight_links),
          focus_outline = VALUES(focus_outline),
          reduce_motion = VALUES(reduce_motion),
          updated_at = CURRENT_TIMESTAMP`,
        [
          userId,
          prefsVersion,
          fontScale,
          dyslexiaFont,
          letterSpacing,
          lineHeight,
          darkMode,
          highContrast,
          invertColors,
          highlightLinks,
          focusOutline,
          reduceMotion
        ]
      );
    }

    const [rows] = await db.query(
      `SELECT prefs_version, font_scale, dyslexia_font, letter_spacing, line_height,
              dark_mode, high_contrast, invert_colors, highlight_links, focus_outline, reduce_motion, updated_at
       FROM user_accessibility_preferences
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );
    const row = rows?.[0];
    return res.json({ accessibility: row ? accessibilityRowToResponse(row) : null });
  } catch (err) {
    console.error('Update accessibility preferences error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.listAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    try {
      const [rows] = await db.query(
        `SELECT id, street_address, city, parish_state, country, postal_code, is_default, created_at, updated_at
         FROM user_addresses
         WHERE user_id = ?
         ORDER BY is_default DESC, id DESC`,
        [userId]
      );
      return res.json(rows || []);
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      await ensureUserAddressesTable();
      const [rows] = await db.query(
        `SELECT id, street_address, city, parish_state, country, postal_code, is_default, created_at, updated_at
         FROM user_addresses
         WHERE user_id = ?
         ORDER BY is_default DESC, id DESC`,
        [userId]
      );
      return res.json(rows || []);
    }
  } catch (err) {
    console.error('List addresses error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.createAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { street_address, city, parish_state, country, postal_code, is_default } = req.body || {};
    const street = String(street_address || '').trim();
    const nextCity = String(city || '').trim();
    const parish = String(parish_state || '').trim();
    const nextCountry = String(country || '').trim();
    const postal = String(postal_code || '').trim();
    const makeDefault = Boolean(is_default);

    if (!street || !nextCity || !parish || !nextCountry) {
      return res.status(400).json({ error: 'Street address, city, parish/state, and country are required' });
    }
    if (street.length > 190) return res.status(400).json({ error: 'Street address is too long' });
    if (postal && postal.length > 30) return res.status(400).json({ error: 'Postal code is too long' });

    try {
      if (makeDefault) {
        await db.query('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [userId]);
      }
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      await ensureUserAddressesTable();
      if (makeDefault) {
        await db.query('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [userId]);
      }
    }

    let result;
    try {
      [result] = await db.query(
        `INSERT INTO user_addresses (user_id, street_address, city, parish_state, country, postal_code, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, street, nextCity, parish, nextCountry, postal || null, makeDefault ? 1 : 0]
      );
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      await ensureUserAddressesTable();
      [result] = await db.query(
        `INSERT INTO user_addresses (user_id, street_address, city, parish_state, country, postal_code, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, street, nextCity, parish, nextCountry, postal || null, makeDefault ? 1 : 0]
      );
    }
    const [rows] = await db.query(
      `SELECT id, street_address, city, parish_state, country, postal_code, is_default, created_at, updated_at
       FROM user_addresses WHERE id = ? AND user_id = ?`,
      [result.insertId, userId]
    );
    return res.status(201).json(rows?.[0]);
  } catch (err) {
    console.error('Create address error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = Number(req.params.id);
    if (!addressId) return res.status(400).json({ error: 'Invalid address id' });
    const { street_address, city, parish_state, country, postal_code, is_default } = req.body || {};
    const street = String(street_address || '').trim();
    const nextCity = String(city || '').trim();
    const parish = String(parish_state || '').trim();
    const nextCountry = String(country || '').trim();
    const postal = String(postal_code || '').trim();
    const makeDefault = Boolean(is_default);

    if (!street || !nextCity || !parish || !nextCountry) {
      return res.status(400).json({ error: 'Street address, city, parish/state, and country are required' });
    }

    let existing;
    try {
      [existing] = await db.query('SELECT id FROM user_addresses WHERE id = ? AND user_id = ?', [addressId, userId]);
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      await ensureUserAddressesTable();
      [existing] = await db.query('SELECT id FROM user_addresses WHERE id = ? AND user_id = ?', [addressId, userId]);
    }
    if (!existing?.length) return res.status(404).json({ error: 'Address not found' });

    if (makeDefault) {
      try {
        await db.query('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [userId]);
      } catch (err) {
        if (!isMissingTableError(err)) throw err;
        await ensureUserAddressesTable();
        await db.query('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [userId]);
      }
    }

    try {
      await db.query(
        `UPDATE user_addresses
         SET street_address = ?, city = ?, parish_state = ?, country = ?, postal_code = ?, is_default = ?
         WHERE id = ? AND user_id = ?`,
        [street, nextCity, parish, nextCountry, postal || null, makeDefault ? 1 : 0, addressId, userId]
      );
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      await ensureUserAddressesTable();
      await db.query(
        `UPDATE user_addresses
         SET street_address = ?, city = ?, parish_state = ?, country = ?, postal_code = ?, is_default = ?
         WHERE id = ? AND user_id = ?`,
        [street, nextCity, parish, nextCountry, postal || null, makeDefault ? 1 : 0, addressId, userId]
      );
    }

    const [rows] = await db.query(
      `SELECT id, street_address, city, parish_state, country, postal_code, is_default, created_at, updated_at
       FROM user_addresses WHERE id = ? AND user_id = ?`,
      [addressId, userId]
    );
    return res.json(rows?.[0]);
  } catch (err) {
    console.error('Update address error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = Number(req.params.id);
    if (!addressId) return res.status(400).json({ error: 'Invalid address id' });
    let existing;
    try {
      [existing] = await db.query(
        'SELECT id, is_default FROM user_addresses WHERE id = ? AND user_id = ?',
        [addressId, userId]
      );
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      await ensureUserAddressesTable();
      [existing] = await db.query(
        'SELECT id, is_default FROM user_addresses WHERE id = ? AND user_id = ?',
        [addressId, userId]
      );
    }
    if (!existing?.length) return res.status(404).json({ error: 'Address not found' });
    try {
      await db.query('DELETE FROM user_addresses WHERE id = ? AND user_id = ?', [addressId, userId]);
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      await ensureUserAddressesTable();
      await db.query('DELETE FROM user_addresses WHERE id = ? AND user_id = ?', [addressId, userId]);
    }
    return res.json({ message: 'Address deleted' });
  } catch (err) {
    console.error('Delete address error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.listPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;
    try {
      const [rows] = await db.query(
        `SELECT id, brand, last4, exp_month, exp_year, holder_name, token, created_at, updated_at
         FROM user_payment_methods
         WHERE user_id = ?
         ORDER BY id DESC`,
        [userId]
      );
      return res.json(rows || []);
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      await ensureUserPaymentMethodsTable();
      const [rows] = await db.query(
        `SELECT id, brand, last4, exp_month, exp_year, holder_name, token, created_at, updated_at
         FROM user_payment_methods
         WHERE user_id = ?
         ORDER BY id DESC`,
        [userId]
      );
      return res.json(rows || []);
    }
  } catch (err) {
    console.error('List payment methods error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.createPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardNumber, exp_month, exp_year, holder_name, brand, last4 } = req.body || {};

    const digits = normalizeDigits(cardNumber || '');
    const month = Number(exp_month);
    const year = Number(exp_year);
    const holder = String(holder_name || '').trim();

    let nextLast4 = String(last4 || '').trim();
    let nextBrand = String(brand || '').trim();

    if (digits) {
      if (digits.length < 12 || digits.length > 19) {
        return res.status(400).json({ error: 'Card number is invalid' });
      }
      nextLast4 = digits.slice(-4);
      nextBrand = cardBrandFromNumber(digits);
    }

    if (!nextLast4 || nextLast4.length !== 4) return res.status(400).json({ error: 'Card last4 is required' });
    if (!nextBrand) nextBrand = 'Card';
    if (!Number.isInteger(month) || month < 1 || month > 12) return res.status(400).json({ error: 'Expiry month is invalid' });
    if (!Number.isInteger(year) || year < 2020 || year > 2100) return res.status(400).json({ error: 'Expiry year is invalid' });

    const token = `pm_${crypto.randomBytes(12).toString('hex')}`;
    let result;
    try {
      [result] = await db.query(
        `INSERT INTO user_payment_methods (user_id, brand, last4, exp_month, exp_year, holder_name, token)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, nextBrand, nextLast4, month, year, holder || null, token]
      );
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      await ensureUserPaymentMethodsTable();
      [result] = await db.query(
        `INSERT INTO user_payment_methods (user_id, brand, last4, exp_month, exp_year, holder_name, token)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, nextBrand, nextLast4, month, year, holder || null, token]
      );
    }

    const [rows] = await db.query(
      `SELECT id, brand, last4, exp_month, exp_year, holder_name, token, created_at, updated_at
       FROM user_payment_methods
       WHERE id = ? AND user_id = ?`,
      [result.insertId, userId]
    );
    return res.status(201).json(rows?.[0]);
  } catch (err) {
    console.error('Create payment method error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.updatePaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const methodId = Number(req.params.id);
    if (!methodId) return res.status(400).json({ error: 'Invalid payment method id' });
    const { exp_month, exp_year, holder_name } = req.body || {};

    const month = Number(exp_month);
    const year = Number(exp_year);
    const holder = String(holder_name || '').trim();

    if (!Number.isInteger(month) || month < 1 || month > 12) return res.status(400).json({ error: 'Expiry month is invalid' });
    if (!Number.isInteger(year) || year < 2020 || year > 2100) return res.status(400).json({ error: 'Expiry year is invalid' });

    let existing;
    try {
      [existing] = await db.query('SELECT id FROM user_payment_methods WHERE id = ? AND user_id = ?', [methodId, userId]);
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      await ensureUserPaymentMethodsTable();
      [existing] = await db.query('SELECT id FROM user_payment_methods WHERE id = ? AND user_id = ?', [methodId, userId]);
    }
    if (!existing?.length) return res.status(404).json({ error: 'Payment method not found' });

    try {
      await db.query(
        `UPDATE user_payment_methods
         SET exp_month = ?, exp_year = ?, holder_name = ?
         WHERE id = ? AND user_id = ?`,
        [month, year, holder || null, methodId, userId]
      );
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      await ensureUserPaymentMethodsTable();
      await db.query(
        `UPDATE user_payment_methods
         SET exp_month = ?, exp_year = ?, holder_name = ?
         WHERE id = ? AND user_id = ?`,
        [month, year, holder || null, methodId, userId]
      );
    }
    const [rows] = await db.query(
      `SELECT id, brand, last4, exp_month, exp_year, holder_name, token, created_at, updated_at
       FROM user_payment_methods
       WHERE id = ? AND user_id = ?`,
      [methodId, userId]
    );
    return res.json(rows?.[0]);
  } catch (err) {
    console.error('Update payment method error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.deletePaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const methodId = Number(req.params.id);
    if (!methodId) return res.status(400).json({ error: 'Invalid payment method id' });
    let existing;
    try {
      [existing] = await db.query('SELECT id FROM user_payment_methods WHERE id = ? AND user_id = ?', [methodId, userId]);
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      await ensureUserPaymentMethodsTable();
      [existing] = await db.query('SELECT id FROM user_payment_methods WHERE id = ? AND user_id = ?', [methodId, userId]);
    }
    if (!existing?.length) return res.status(404).json({ error: 'Payment method not found' });
    try {
      await db.query('DELETE FROM user_payment_methods WHERE id = ? AND user_id = ?', [methodId, userId]);
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      await ensureUserPaymentMethodsTable();
      await db.query('DELETE FROM user_payment_methods WHERE id = ? AND user_id = ?', [methodId, userId]);
    }
    return res.json({ message: 'Payment method deleted' });
  } catch (err) {
    console.error('Delete payment method error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};
