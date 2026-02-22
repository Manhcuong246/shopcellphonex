const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth');
const authService = require('../services/authService');

const router = express.Router();

const uploadsDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const ext = (file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i) || [])[1] || 'jpg';
      cb(null, `${req.user.id}-${Date.now()}.${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Chỉ chấp nhận file ảnh'));
  },
});

function setRefreshTokenCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: authService.COOKIE_MAX_AGE * 1000,
    path: authService.REFRESH_COOKIE_PATH,
  });
}

function clearRefreshTokenCookie(res) {
  res.clearCookie('refresh_token', { path: authService.REFRESH_COOKIE_PATH, httpOnly: true });
}

router.post('/register', async (req, res) => {
  try {
    const result = await authService.register(req.body);
    setRefreshTokenCookie(res, result.refreshToken);
    res.status(201).json({ token: result.accessToken, user: result.user });
  } catch (e) {
    if (e.message === 'BadRequest') return res.status(400).json({ message: 'Thiếu thông tin' });
    if (e.message === 'EmailExists') return res.status(400).json({ message: 'Email đã được sử dụng' });
    throw e;
  }
});

router.post('/login', async (req, res) => {
  try {
    const result = await authService.login(req.body);
    setRefreshTokenCookie(res, result.refreshToken);
    res.json({ token: result.accessToken, user: result.user });
  } catch (e) {
    if (e.message === 'BadRequest') return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' });
    if (e.message === 'Unauthorized') return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });
    throw e;
  }
});

router.post('/refresh-token', async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) return res.status(200).json({ token: null });
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
  } catch {
    clearRefreshTokenCookie(res);
    return res.status(401).json({});
  }
  if (decoded.type !== 'refresh') {
    clearRefreshTokenCookie(res);
    return res.status(401).json({});
  }
  const result = await authService.refreshToken(authService.hashToken(refreshToken));
  if (!result) {
    clearRefreshTokenCookie(res);
    return res.status(401).json({});
  }
  res.json({ token: result.accessToken });
});

router.post('/logout', async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (token) await authService.logout(authService.hashToken(token));
  clearRefreshTokenCookie(res);
  res.json({});
});

router.get('/me', auth, async (req, res) => {
  const user = await authService.getMe(req.user.id);
  if (!user) return res.status(404).json({});
  res.json(user);
});

router.patch('/profile', auth, async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  res.json(user);
});

router.put('/password', auth, async (req, res) => {
  try {
    await authService.changePassword(req.user.id, req.body);
    res.json({});
  } catch (e) {
    if (e.message === 'BadRequest') return res.status(400).json({});
    if (e.message === 'Unauthorized') return res.status(401).json({});
    throw e;
  }
});

router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({});
  const user = await authService.updateAvatar(req.user.id, req.file.filename);
  res.json(user);
});

module.exports = router;
