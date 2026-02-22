require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const USERS = [
  { email: 'admin@cellphone.com', password: '123456', full_name: 'Admin', phone: '0901234567', role: 'admin' },
  { email: 'staff@cellphone.com', password: '123456', full_name: 'Nhân viên', phone: '0912345678', role: 'staff' },
];

async function seed() {
  for (const u of USERS) {
    const [ex] = await db.query('SELECT id FROM users WHERE email = ?', [u.email]);
    const hash = await bcrypt.hash(u.password, 10);
    if (ex.length) {
      await db.query('UPDATE users SET password = ?, full_name = ?, phone = ?, role = ? WHERE id = ?', [hash, u.full_name, u.phone, u.role, ex[0].id]);
    } else {
      await db.query('INSERT INTO users (email, password, full_name, phone, role) VALUES (?, ?, ?, ?, ?)', [u.email, hash, u.full_name, u.phone, u.role]);
    }
  }
  console.log('Admin: admin@cellphone.com | Staff: staff@cellphone.com | MK: 123456');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
