const express = require('express');
const cors    = require('cors');
const path = require('path');
require('dotenv').config();

const productRoutes = require('./routes/products');
const authRoutes    = require('./routes/auth');
const cartRoutes    = require('./routes/cart');
const orderRoutes   = require('./routes/orders');
const adminRoutes   = require('./routes/admin');
const wishlistRoutes = require('./routes/wishlist');
const profileRoutes = require('./routes/profile');
const paypalRoutes = require('./paypal');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Cache static assets for 1 year
app.use('/uploads', express.static('uploads', {
  maxAge: '1y',
  immutable: true
}));
// Cache API responses for 5 minutes
app.use((req, res, next) => {
  if (req.method === 'GET' && req.path.startsWith('/api/products')) {
    res.set('Cache-Control', 'public, max-age=300');
  }
  next();
});
// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost:')) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    // Uploads are not filename-hashed, so keep cache lifetime short.
    maxAge: isProd ? '7d' : 0,
    etag: true,
    lastModified: true,
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
  })
);

// Routes
app.use('/api/products', productRoutes);
app.use('/api/auth',     authRoutes);
app.use('/api/cart',     cartRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/profile',  profileRoutes);
app.use('/api/paypal', paypalRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Error handler (including multer upload errors)
app.use((err, req, res, next) => {
  if (!err) return next();
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Image is too large (max 5MB)' });
    }
    return res.status(400).json({ error: err.message || 'Upload error' });
  }
  const message = String(err.message || '');
  if (message.toLowerCase().includes('only') && message.toLowerCase().includes('image')) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TrooperGear API running on port ${PORT}`);
});
