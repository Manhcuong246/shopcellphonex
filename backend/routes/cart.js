const express = require('express');
const db = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  const [rows] = await db.query(
    `SELECT ci.id, ci.quantity, ci.variant_id, ci.variant_label, ci.price,
             p.id as product_id, p.name, p.slug, p.image
     FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.user_id = ?`,
    [req.user.id]
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { variant_id, quantity = 1 } = req.body;
  const [vRows] = await db.query(
    `SELECT pv.id, pv.product_id, pv.model_name, pv.color_name, pv.price, pv.sale_price, pv.stock, p.name as product_name, p.slug
     FROM product_variants pv JOIN products p ON pv.product_id = p.id WHERE pv.id = ?`,
    [variant_id]
  );
  const v = vRows[0];
  const qty = Math.max(1, parseInt(quantity) || 1);
  const variantLabel = `${v.model_name} - ${v.color_name}`;
  const price = v.sale_price || v.price;
  await db.query(
    `INSERT INTO cart_items (user_id, product_id, variant_id, variant_label, quantity, price)
     VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), price = VALUES(price)`,
    [req.user.id, v.product_id, variant_id, variantLabel, qty, price]
  );
  const [rows] = await db.query(
    `SELECT ci.id, ci.quantity, ci.variant_id, ci.variant_label, ci.price, p.id as product_id, p.name, p.slug, p.image
     FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.user_id = ? AND ci.variant_id = ?`,
    [req.user.id, variant_id]
  );
  res.json(rows[0]);
});

router.delete('/:variantId', async (req, res) => {
  await db.query('DELETE FROM cart_items WHERE user_id = ? AND variant_id = ?', [req.user.id, req.params.variantId]);
  res.json({ message: 'Đã xóa' });
});

router.patch('/:variantId', async (req, res) => {
  const quantity = Math.max(0, parseInt(req.body.quantity));
  if (quantity === 0) {
    await db.query('DELETE FROM cart_items WHERE user_id = ? AND variant_id = ?', [req.user.id, req.params.variantId]);
    return res.json({ message: 'Đã xóa khỏi giỏ' });
  }
  await db.query('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND variant_id = ?', [quantity, req.user.id, req.params.variantId]);
  res.json({ message: 'Đã cập nhật' });
});

module.exports = router;
