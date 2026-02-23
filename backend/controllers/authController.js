const jwt = require('jsonwebtoken');
const authService = require('../services/authService');

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

async function register(req, res) {
  const result = await authService.register(req.body);
  setRefreshTokenCookie(res, result.refreshToken);
  res.status(201).json({ token: result.accessToken, user: result.user });
}

async function login(req, res) {
  const result = await authService.login(req.body);
  setRefreshTokenCookie(res, result.refreshToken);
  res.json({ token: result.accessToken, user: result.user });
}

async function refreshToken(req, res) {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) return res.status(200).json({ token: null });
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
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
  } catch {
    clearRefreshTokenCookie(res);
    res.status(401).json({});
  }
}

async function logout(req, res) {
  const token = req.cookies?.refresh_token;
  if (token) await authService.logout(authService.hashToken(token));
  clearRefreshTokenCookie(res);
  res.json({});
}

async function getMe(req, res) {
  const user = await authService.getMe(req.user.id);
  res.json(user || {});
}

async function updateProfile(req, res) {
  const user = await authService.updateProfile(req.user.id, req.body);
  res.json(user);
}

async function changePassword(req, res) {
  await authService.changePassword(req.user.id, req.body);
  res.json({});
}

async function avatar(req, res) {
  if (!req.file) return res.status(400).json({});
  const user = await authService.updateAvatar(req.user.id, req.file.filename);
  res.json(user);
}

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword,
  avatar,
};
