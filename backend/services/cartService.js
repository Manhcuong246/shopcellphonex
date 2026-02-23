const db = require('../config/db');

async function getCart(userId) {
  const [rows] = await db.query(
    `SELECT ci.id, ci.quantity, ci.variant_id, ci.variant_label, ci.price,
             p.id as product_id, p.name, p.slug, p.image
     FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.user_id = ?`,
    [userId]
  );
  return rows;
}

async function addItem(userId, body) {
  const { variant_id, quantity = 1 } = body;
  const [vRows] = await db.query(
    `SELECT pv.id, pv.product_id, pv.model_name, pv.color_name, pv.price, pv.sale_price, pv.stock, p.name as product_name, p.slug
     FROM product_variants pv JOIN products p ON pv.product_id = p.id WHERE pv.id = ?`,
    [variant_id]
  );
  const v = vRows?.[0];
  if (!v) return null;
  const qty = Math.max(1, parseInt(quantity) || 1);
  const variantLabel = `${v.model_name} - ${v.color_name}`;
  const price = v.sale_price || v.price;
  await db.query(
    `INSERT INTO cart_items (user_id, product_id, variant_id, variant_label, quantity, price)
     VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), price = VALUES(price)`,
    [userId, v.product_id, variant_id, variantLabel, qty, price]
  );
  const [rows] = await db.query(
    `SELECT ci.id, ci.quantity, ci.variant_id, ci.variant_label, ci.price, p.id as product_id, p.name, p.slug, p.image
     FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.user_id = ? AND ci.variant_id = ?`,
    [userId, variant_id]
  );
  return rows?.[0];
}

async function updateItem(userId, variantId, quantity) {
  const qty = Math.max(0, parseInt(quantity));
  if (qty === 0) {
    await db.query('DELETE FROM cart_items WHERE user_id = ? AND variant_id = ?', [userId, variantId]);
    return { removed: true };
  }
  await db.query('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND variant_id = ?', [qty, userId, variantId]);
  return { removed: false };
}

async function removeItem(userId, variantId) {
  await db.query('DELETE FROM cart_items WHERE user_id = ? AND variant_id = ?', [userId, variantId]);
}

module.exports = { getCart, addItem, updateItem, removeItem };
