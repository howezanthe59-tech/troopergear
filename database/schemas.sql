-- TrooperGear Database Schema + Seed (MySQL)
-- Run this file to create the DB, tables, and initial sample products.

CREATE DATABASE IF NOT EXISTS troopergear_db;
USE troopergear_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone_number VARCHAR(30),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cookie consent preferences (one row per user)
CREATE TABLE IF NOT EXISTS user_cookie_consents (
  user_id INT NOT NULL PRIMARY KEY,
  consent_version TINYINT NOT NULL DEFAULT 1,
  analytics TINYINT(1) NOT NULL DEFAULT 0,
  marketing TINYINT(1) NOT NULL DEFAULT 0,
  functional TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Accessibility preferences (one row per user)
CREATE TABLE IF NOT EXISTS user_accessibility_preferences (
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
);

CREATE TABLE IF NOT EXISTS user_addresses (
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
);

-- Payment methods (NOTE: Do not store raw card numbers/CVV. Store only non-sensitive metadata + a token placeholder.)
CREATE TABLE IF NOT EXISTS user_payment_methods (
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
);

-- Default accounts for local development/testing
-- Admin: admin@troopergear.local / Admin123!
-- User:  user@troopergear.local  / User123!
INSERT INTO users (id, name, email, password_hash, role) VALUES
(1, 'Trooper Admin', 'admin@troopergear.local', '$2b$10$p7RJErRC3LbPW/fH5Udeuu2rbyM3r9c4QJXt.q0NlFImae4CVkpv6', 'admin'),
(2, 'Trooper User',  'user@troopergear.local',  '$2b$10$5fgKZ4anUucpUkFNx6iaYuAt3Quf4Z7OqeRlZh.UfqHJcObnop142', 'user')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password_hash = VALUES(password_hash),
  role = VALUES(role);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(120) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  badge VARCHAR(50),
  -- Stores either a public URL or a local path like: /uploads/products/<file>
  image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  variant_color VARCHAR(50),
  variant_size VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'processing',
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  variant_color VARCHAR(50),
  variant_size VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wishlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_product (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed (optional but included here to keep a single SQL file)
INSERT INTO products (id, name, category, description, price, stock, badge, image) VALUES
(1,  'SummitGuard Hiking Shoe',     'Footwear',     'A high-performance hiking shoe offering stability and protection on tough terrain.', 179.59, 25, 'Bestseller', '/uploads/products/shoe3.png'),
(2,  'SummitLite Trail Backpack',   'Backpack',     'Designed for tropical nights and changing weather. Lightweight and breathable.',      54.50, 30, NULL,         '/uploads/products/bag4.png'),
(3,  'MalShoe Ridge Hiker',         'Footwear',     'Rugged hiking shoe built for rocky trails, wet roots, and long-distance comfort.',   149.00, 18, 'New',        '/uploads/products/MALSHOE.png'),
(4,  'RidgeRunner 100L Backpack',   'Backpack',     'Heavy-duty expedition backpack for long mountain treks and climbing adventures.',   129.99, 15, 'Premium',    '/uploads/products/bag.png'),
(5,  'FemShoe Trail Breeze',        'Footwear',     'Lightweight women''s trail shoe with responsive cushioning and breathable mesh.',    139.00, 22, NULL,         '/uploads/products/femshoe1.png'),
(6,  'Riverstone DryPack 35L',      'Backpack',     'Waterproof roll-top pack built for river crossings and sudden tropical rain.',       89.00, 28, 'New',        '/uploads/products/bag1.png'),
(7,  'SummitShade Trek Tent',       'Camping Tent', 'All-weather trekking tent with reinforced seams and quick pitch setup.',             59.99, 40, NULL,         '/uploads/products/Tent (3).png'),
(8,  'CanopyLite 2P Tent',          'Camping Tent', 'Compact two-person shelter with fast setup and high airflow for island nights.',    119.00, 18, 'Premium',    '/uploads/products/tent2.png'),
(9,  'StormGuard Basecamp Tent',    'Camping Tent', 'Spacious basecamp tent designed for extended stays and strong winds.',              149.50, 12, NULL,         '/uploads/products/tent3.png'),
(10, 'TrailBeam Flashlight',        'Equipments',   'High-lumen outdoor flashlight with rugged grip and storm-ready build.',               24.99, 45, NULL,         '/uploads/products/flashlight.png'),
(11, 'TrailRoute Map Set',          'Equipments',   'Detailed trail map set for Jamaica''s most popular routes and campsites.',            14.50, 80, NULL,         '/uploads/products/map.png'),
(12, 'StormGuide Weather Station',  'Equipments',   'Portable weather tracker to monitor humidity, pressure, and rain shifts.',            79.00, 12, 'New',        '/uploads/products/machine.png');
