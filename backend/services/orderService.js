const db = require('../config/db');

async function createOrder(userId, { shipping_address, shipping_phone, note, items: bodyItems }) {
  if (!shipping_address || !shipping_phone || !Array.isArray(bodyItems) || bodyItems.length === 0) throw new Error('BadRequest');
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    let total = 0;
    const items = [];
    for (const item of bodyItems) {
      const variant_id = item.variant_id;
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      const [v] = await connection.query('SELECT stock FROM product_variants WHERE id = ?', [variant_id]);
      if (!v?.length || v[0].stock < quantity) throw new Error('Stock');
      const price = Number(item.price);
      total += price * quantity;
      items.push({
        product_id: item.product_id,
        variant_id,
        variant_label: item.variant_label || '',
        product_name: item.product_name || '',
        price,
        quantity,
      });
    }
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total, shipping_address, shipping_phone, note) VALUES (?, ?, ?, ?, ?)',
      [userId, total, shipping_address, shipping_phone, note || null]
    );
    const orderId = orderResult.insertId;
    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, variant_id, variant_label, product_name, price, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.variant_id, item.variant_label, item.product_name, item.price, item.quantity]
      );
      await connection.query('UPDATE product_variants SET stock = stock - ? WHERE id = ?', [item.quantity, item.variant_id]);
    }
    await connection.commit();
    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    return rows[0];
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function getOrdersByUser(userId) {
  const [orders] = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  for (const order of orders) {
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    order.items = items;
  }
  return orders;
}

async function getOrderById(orderId, userId) {
  const [orders] = await db.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId]);
  if (!orders?.length) return null;
  const order = orders[0];
  const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  order.items = items;
  return order;
}

module.exports = { createOrder, getOrdersByUser, getOrderById };
