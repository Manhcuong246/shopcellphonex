require('dotenv').config();
require('express-async-errors');

if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'dev-secret';
if (!process.env.JWT_REFRESH_SECRET) process.env.JWT_REFRESH_SECRET = process.env.JWT_SECRET;

const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { auth } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const categoriesRoutes = require('./routes/categories');
const cartRoutes = require('./routes/cart');
const ordersRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const staffRoutes = require('./routes/staff');

const app = express();
const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/cart', auth, cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  const msg = err.message;
  if (msg === 'BadRequest') return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' });
  if (msg === 'Unauthorized') return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
  if (msg === 'EmailExists') return res.status(409).json({ message: 'Email đã được sử dụng' });
  console.error(err);
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({
    message: 'Lỗi server',
    ...(isDev && { error: msg, stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server http://localhost:${PORT}`));
