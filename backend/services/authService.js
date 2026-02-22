const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

function normalizeRole(role) {
  return role === 'user' ? 'customer' : role;
}

function createAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function createRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function formatUser(user) {
  if (!user) return null;
  user.role = normalizeRole(user.role);
  if (user.avatar && !user.avatar.startsWith('http') && !user.avatar.startsWith('/')) {
    user.avatar = '/api/uploads/avatars/' + user.avatar;
  }
  return user;
}

async function register({ email, password, full_name, phone }) {
  if (!email || !password || !full_name) throw new Error('BadRequest');
  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) throw new Error('EmailExists');
  const hashedPassword = await bcrypt.hash(password, 10);
  await db.query('INSERT INTO users (email, password, full_name, phone) VALUES (?, ?, ?, ?)', [email, hashedPassword, full_name, phone || null]);
  const [rows] = await db.query('SELECT id, email, full_name, phone, address, avatar, role FROM users WHERE email = ?', [email]);
  const user = formatUser(rows[0]);
  const accessToken = createAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = createRefreshToken({ id: user.id, type: 'refresh' });
  await db.query('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)', [user.id, hashToken(refreshToken), new Date(Date.now() + COOKIE_MAX_AGE * 1000)]);
  return { user, accessToken, refreshToken };
}

async function login({ email, password }) {
  if (!email || !password) throw new Error('BadRequest');
  const [rows] = await db.query('SELECT id, email, password, full_name, phone, address, avatar, role FROM users WHERE email = ?', [email]);
  if (!rows.length) throw new Error('Unauthorized');
  const user = rows[0];
  if (!(await bcrypt.compare(password, user.password))) throw new Error('Unauthorized');
  delete user.password;
  const formatted = formatUser(user);
  const accessToken = createAccessToken({ id: user.id, email: user.email, role: formatted.role });
  const refreshToken = createRefreshToken({ id: user.id, type: 'refresh' });
  await db.query('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)', [user.id, hashToken(refreshToken), new Date(Date.now() + COOKIE_MAX_AGE * 1000)]);
  return { user: formatted, accessToken, refreshToken };
}

async function refreshToken(tokenHash) {
  const [rows] = await db.query(
    'SELECT u.id as user_id, u.email, u.role FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id WHERE rt.token_hash = ? AND rt.expires_at > NOW()',
    [tokenHash]
  );
  if (!rows.length) return null;
  const user = { id: rows[0].user_id, email: rows[0].email, role: normalizeRole(rows[0].role) };
  return { accessToken: createAccessToken(user) };
}

async function logout(tokenHash) {
  if (tokenHash) await db.query('DELETE FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);
}

async function getMe(userId) {
  const [rows] = await db.query('SELECT id, email, full_name, phone, address, avatar, role FROM users WHERE id = ?', [userId]);
  if (!rows.length) return null;
  return formatUser(rows[0]);
}

async function updateProfile(userId, { full_name, phone, address }) {
  await db.query('UPDATE users SET full_name = COALESCE(?, full_name), phone = ?, address = ? WHERE id = ?', [full_name || null, phone || null, address || null, userId]);
  return getMe(userId);
}

async function changePassword(userId, { current_password, new_password }) {
  if (!current_password || !new_password) throw new Error('BadRequest');
  const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
  if (!rows.length || !(await bcrypt.compare(current_password, rows[0].password))) throw new Error('Unauthorized');
  await db.query('UPDATE users SET password = ? WHERE id = ?', [await bcrypt.hash(new_password, 10), userId]);
}

async function updateAvatar(userId, filename) {
  await db.query('UPDATE users SET avatar = ? WHERE id = ?', [filename, userId]);
  const [rows] = await db.query('SELECT id, email, full_name, phone, address, avatar, role FROM users WHERE id = ?', [userId]);
  const user = rows[0];
  user.avatar = '/api/uploads/avatars/' + filename;
  return user;
}

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword,
  updateAvatar,
  hashToken,
  COOKIE_MAX_AGE,
  REFRESH_COOKIE_PATH: '/api/auth/refresh-token',
};
