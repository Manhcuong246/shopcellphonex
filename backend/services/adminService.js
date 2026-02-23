const db = require('../config/db');
const staffService = require('./staffService');

function toSlug(s) {
  return (s || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '') || '';
}

async function getStats() {
  const [revenueRows] = await db.query(
    `SELECT DATE(created_at) as date, SUM(total) as total, COUNT(*) as count
     FROM orders WHERE status NOT IN ('cancelled') AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
     GROUP BY DATE(created_at) ORDER BY date`
  );

  const [summaryRows] = await db.query(
    `SELECT
       (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status NOT IN ('cancelled') AND DATE(created_at) = CURDATE()) as today_revenue,
       (SELECT COUNT(*) FROM orders WHERE status NOT IN ('cancelled') AND DATE(created_at) = CURDATE()) as today_orders,
       (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
       (SELECT COUNT(*) FROM products) as total_products,
       (SELECT COUNT(*) FROM users WHERE role IN ('customer','user')) as total_customers`
  );
  const summary = summaryRows[0];

  const [topProductRows] = await db.query(
    `SELECT oi.product_name, oi.variant_label, SUM(oi.quantity) as sold, SUM(oi.price * oi.quantity) as revenue
     FROM order_items oi JOIN orders o ON o.id = oi.order_id
     WHERE o.status NOT IN ('cancelled') AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
     GROUP BY oi.product_id, oi.variant_id ORDER BY sold DESC LIMIT 10`
  );

  const [statusCountRows] = await db.query('SELECT status, COUNT(*) as count FROM orders GROUP BY status');

  return {
    revenueByDay: revenueRows,
    summary,
    topProducts: topProductRows,
    statusCounts: statusCountRows,
  };
}

async function getOrders(filters = {}) {
  const { status, dateFrom, dateTo, search } = filters;
  let sql = `SELECT o.*, u.full_name as customer_name, u.email as customer_email
     FROM orders o JOIN users u ON u.id = o.user_id WHERE 1=1`;
  const params = [];
  if (status?.trim()) { sql += ' AND o.status = ?'; params.push(status.trim()); }
  if (dateFrom) { sql += ' AND DATE(o.created_at) >= ?'; params.push(dateFrom); }
  if (dateTo) { sql += ' AND DATE(o.created_at) <= ?'; params.push(dateTo); }
  if (search?.trim()) {
    sql += ' AND (o.id = ? OR u.full_name LIKE ? OR u.email LIKE ?)';
    const term = '%' + search.trim() + '%';
    const id = parseInt(search.trim(), 10);
    params.push(Number.isInteger(id) ? id : 0, term, term);
  }
  sql += ' ORDER BY o.created_at DESC';
  const [orders] = await db.query(sql, params);
  for (const order of orders) {
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    order.items = items;
  }
  return orders;
}

async function listCategories() {
  const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
  return rows;
}

async function createCategory(body) {
  const { name, slug: slugInput, description } = body;
  if (!name?.trim()) throw new Error('BadRequest');
  let slug = (slugInput?.trim()) ? toSlug(slugInput) : toSlug(name);
  if (!slug) slug = 'dm-' + Date.now();
  const [ex] = await db.query('SELECT id FROM categories WHERE slug = ?', [slug]);
  if (ex?.length) slug = slug + '-' + Date.now();
  await db.query('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', [name.trim(), slug, description || null]);
  const [rows] = await db.query('SELECT * FROM categories WHERE slug = ?', [slug]);
  return rows[0];
}

async function updateCategory(id, body) {
  const { name, slug: slugInput, description } = body;
  const [ex] = await db.query('SELECT id, slug FROM categories WHERE id = ?', [id]);
  if (!ex?.length) return null;
  const updates = [];
  const params = [];
  if (name !== undefined) { updates.push('name = ?'); params.push(name.trim()); }
  if (slugInput !== undefined) { updates.push('slug = ?'); params.push(toSlug(slugInput.trim()) || ex[0].slug); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description || null); }
  if (updates.length) {
    params.push(id);
    await db.query('UPDATE categories SET ' + updates.join(', ') + ' WHERE id = ?', params);
  }
  const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
  return rows[0];
}

async function deleteCategory(id) {
  const [count] = await db.query('SELECT COUNT(*) as n FROM products WHERE category_id = ?', [id]);
  if (count[0].n > 0) throw new Error('CategoryInUse');
  const [r] = await db.query('DELETE FROM categories WHERE id = ?', [id]);
  return r.affectedRows > 0;
}

async function listUsers() {
  const [rows] = await db.query('SELECT id, email, full_name, phone, role, created_at FROM users ORDER BY created_at DESC');
  return rows;
}

async function updateUserRole(userId, role, currentUserId) {
  const allowed = ['customer', 'staff', 'admin'];
  if (!role || !allowed.includes(role)) return false;
  if (userId === currentUserId) return false;
  const [r] = await db.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
  return r.affectedRows > 0;
}

module.exports = {
  getStats,
  getOrders,
  updateOrderStatus: staffService.updateOrderStatus,
  listProducts: staffService.listProducts,
  getProductById: staffService.getProductById,
  createProduct: staffService.createProduct,
  updateProduct: staffService.updateProduct,
  deleteProduct: staffService.deleteProduct,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listUsers,
  updateUserRole,
};
