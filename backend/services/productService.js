const db = require('../config/db');

async function list(query = {}) {
  const { category, search, limit = 50, offset = 0 } = query;
  let sql = `SELECT p.id, p.name, p.slug, p.description,
       COALESCE(p.image, (SELECT pv.image FROM product_variants pv WHERE pv.product_id = p.id AND pv.image IS NOT NULL LIMIT 1)) as image,
       p.brand, p.category_id, c.name as category_name, c.slug as category_slug,
       (SELECT MIN(COALESCE(pv.sale_price, pv.price)) FROM product_variants pv WHERE pv.product_id = p.id) as price,
       (SELECT MIN(pv.sale_price) FROM product_variants pv WHERE pv.product_id = p.id AND pv.sale_price IS NOT NULL) as sale_price,
       (SELECT SUM(pv.stock) FROM product_variants pv WHERE pv.product_id = p.id) as stock
    FROM products p JOIN categories c ON p.category_id = c.id WHERE 1=1`;
  const params = [];
  if (category) { sql += ' AND c.slug = ?'; params.push(category); }
  if (search) { sql += ' AND (p.name LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  const [rows] = await db.query(sql, params);
  return rows;
}

async function getCartInfo(variantIdsStr) {
  if (!variantIdsStr || typeof variantIdsStr !== 'string') return [];
  const ids = [...new Set(variantIdsStr.split(',').map((id) => parseInt(id, 10)).filter(Number.isInteger))];
  if (!ids.length) return [];
  const [rows] = await db.query(
    `SELECT pv.id as variant_id, pv.product_id, p.name, p.slug, COALESCE(pv.image, p.image) as image,
      CONCAT(pv.model_name, ' - ', pv.color_name) as variant_label, pv.price, pv.sale_price, pv.stock
     FROM product_variants pv JOIN products p ON pv.product_id = p.id WHERE pv.id IN (${ids.map(() => '?').join(',')})`,
    ids
  );
  return (rows || []).map((r) => ({
    variant_id: r.variant_id, product_id: r.product_id, name: r.name, slug: r.slug, image: r.image,
    variant_label: r.variant_label, price: r.sale_price != null ? r.sale_price : r.price, sale_price: r.sale_price, stock: r.stock,
  }));
}

async function getBySlug(slug) {
  const [productRows] = await db.query(
    'SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p JOIN categories c ON p.category_id = c.id WHERE p.slug = ?',
    [slug]
  );
  if (!productRows?.length) return null;
  const product = productRows[0];
  const [variants] = await db.query('SELECT id, model_name, color_name, color_hex, price, sale_price, stock, image FROM product_variants WHERE product_id = ? ORDER BY model_name, color_name', [product.id]);
  product.variants = variants;
  return product;
}

async function getComments(slug) {
  const [p] = await db.query('SELECT id FROM products WHERE slug = ?', [slug]);
  if (!p?.length) return [];
  const [rows] = await db.query(
    `SELECT pc.id, pc.content, pc.rating, pc.created_at, u.full_name, u.avatar
     FROM product_comments pc JOIN users u ON pc.user_id = u.id WHERE pc.product_id = ? ORDER BY pc.created_at DESC`,
    [p[0].id]
  );
  return (rows || []).map((r) => ({
    id: r.id, content: r.content, rating: r.rating, created_at: r.created_at, user_name: r.full_name,
    user_avatar: r.avatar ? (r.avatar.startsWith('/') ? r.avatar : '/api/uploads/avatars/' + r.avatar) : null,
  }));
}

async function addComment(slug, userId, body) {
  const [p] = await db.query('SELECT id FROM products WHERE slug = ?', [slug]);
  if (!p?.length) return null;
  const productId = p[0].id;
  const { content, rating } = body;
  const r = rating != null ? Math.min(5, Math.max(1, parseInt(rating))) : null;
  await db.query('INSERT INTO product_comments (product_id, user_id, content, rating) VALUES (?, ?, ?, ?)', [productId, userId, (content || '').trim(), r]);
  const [rows] = await db.query(
    `SELECT pc.id, pc.content, pc.rating, pc.created_at, u.full_name, u.avatar
     FROM product_comments pc JOIN users u ON pc.user_id = u.id WHERE pc.product_id = ? AND pc.user_id = ? ORDER BY pc.created_at DESC LIMIT 1`,
    [productId, userId]
  );
  const c = rows?.[0];
  return c ? { ...c, user_avatar: c.avatar ? '/api/uploads/avatars/' + c.avatar : null } : null;
}

module.exports = { list, getCartInfo, getBySlug, getComments, addComment };
