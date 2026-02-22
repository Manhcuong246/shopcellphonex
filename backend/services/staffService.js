const db = require('../config/db');
const { slugify } = require('../lib/slugify');

async function getStats() {
  // Thống kê tổng quan (1 dòng)
  const [summaryRows] = await db.query(
    `SELECT (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
      (SELECT COUNT(*) FROM orders WHERE status NOT IN ('cancelled') AND DATE(created_at) = CURDATE()) as today_orders,
      (SELECT COUNT(*) FROM orders WHERE status IN ('confirmed','shipping')) as processing_orders`
  );
  const summary = summaryRows[0];

  // Danh sách đơn gần đây (nhiều dòng)
  const [recentRows] = await db.query(
    `SELECT o.id, o.status, o.total, o.created_at, u.full_name as customer_name
     FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC LIMIT 10`
  );

  return { summary, recent: recentRows };
}

async function getOrders(filters = {}) {
  const { status, search } = filters;
  let sql = `SELECT o.*, u.full_name as customer_name, u.email as customer_email
     FROM orders o JOIN users u ON u.id = o.user_id WHERE 1=1`;
  const params = [];
  if (status?.trim()) { sql += ' AND o.status = ?'; params.push(status.trim()); }
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

async function updateOrderStatus(orderId, status) {
  const allowed = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];
  if (!Number.isInteger(orderId) || !status || !allowed.includes(status)) return { ok: false, notFound: false };
  const [r] = await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
  return { ok: r.affectedRows > 0, notFound: r.affectedRows === 0 };
}

async function listProducts() {
  const [rows] = await db.query(
    `SELECT p.id, p.name, p.slug, p.description, p.image, p.brand, p.category_id, p.created_at,
      c.name as category_name, (SELECT SUM(pv.stock) FROM product_variants pv WHERE pv.product_id = p.id) as stock
     FROM products p JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC`
  );
  return rows;
}

async function getProductById(id) {
  const [product] = await db.query('SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [id]);
  if (!product?.length) return null;
  const [variants] = await db.query('SELECT * FROM product_variants WHERE product_id = ? ORDER BY model_name, color_name', [id]);
  product[0].variants = variants;
  return product[0];
}

async function createProduct(body) {
  const { name, category_id, description, image, brand, variants } = body;
  if (!name || !category_id) throw new Error('BadRequest');
  let slug = slugify(name) || 'sp-' + Date.now();
  const [ex] = await db.query('SELECT id FROM products WHERE slug = ?', [slug]);
  if (ex?.length) slug = slug + '-' + Date.now();
  await db.query(
    'INSERT INTO products (category_id, name, slug, description, image, brand) VALUES (?, ?, ?, ?, ?, ?)',
    [category_id, name.trim(), slug, description || null, image || null, brand || null]
  );
  const [ins] = await db.query('SELECT LAST_INSERT_ID() as id');
  const productId = ins[0].id;
  const vList = Array.isArray(variants) ? variants : [];
  for (const v of vList) {
    const model = (v.model_name || '').trim() || 'Mặc định';
    const color = (v.color_name || '').trim() || 'Đen';
    const price = Number(v.price);
    if (price <= 0) continue;
    const sale_price = v.sale_price != null ? Number(v.sale_price) : null;
    const stock = Math.max(0, parseInt(v.stock, 10) || 0);
    await db.query(
      'INSERT INTO product_variants (product_id, model_name, color_name, color_hex, price, sale_price, stock, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [productId, model, color, v.color_hex || null, price, sale_price, stock, v.image || null]
    );
  }
  return getProductById(productId);
}

async function updateProduct(id, body) {
  const { name, category_id, description, image, brand, variants } = body;
  const [ex] = await db.query('SELECT id, slug FROM products WHERE id = ?', [id]);
  if (!ex?.length) return null;
  const updates = [];
  const params = [];
  if (name !== undefined) { updates.push('name = ?'); params.push(name.trim()); }
  if (category_id !== undefined) { updates.push('category_id = ?'); params.push(category_id); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description || null); }
  if (image !== undefined) { updates.push('image = ?'); params.push(image || null); }
  if (brand !== undefined) { updates.push('brand = ?'); params.push(brand || null); }
  if (updates.length) {
    params.push(id);
    await db.query('UPDATE products SET ' + updates.join(', ') + ' WHERE id = ?', params);
  }
  if (Array.isArray(variants)) {
    await db.query('DELETE FROM product_variants WHERE product_id = ?', [id]);
    for (const v of variants) {
      const model = (v.model_name || '').trim() || 'Mặc định';
      const color = (v.color_name || '').trim() || 'Đen';
      const price = Number(v.price);
      if (price <= 0) continue;
      const sale_price = v.sale_price != null ? Number(v.sale_price) : null;
      const stock = Math.max(0, parseInt(v.stock, 10) || 0);
      await db.query(
        'INSERT INTO product_variants (product_id, model_name, color_name, color_hex, price, sale_price, stock, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, model, color, v.color_hex || null, price, sale_price, stock, v.image || null]
      );
    }
  }
  return getProductById(id);
}

async function deleteProduct(id) {
  const [r] = await db.query('DELETE FROM products WHERE id = ?', [id]);
  return r.affectedRows > 0;
}

module.exports = {
  getStats,
  getOrders,
  updateOrderStatus,
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
