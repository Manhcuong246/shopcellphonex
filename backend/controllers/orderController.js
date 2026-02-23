const orderService = require('../services/orderService');

async function create(req, res) {
  if (req.user.role === 'admin' || req.user.role === 'staff') return res.status(403).json({});
  const order = await orderService.createOrder(req.user.id, req.body);
  res.status(201).json({ message: 'Đặt hàng thành công', order });
}

async function list(req, res) {
  const orders = await orderService.getOrdersByUser(req.user.id);
  res.json(orders);
}

async function getById(req, res) {
  const order = await orderService.getOrderById(parseInt(req.params.id, 10), req.user.id);
  if (!order) return res.status(404).json({});
  res.json(order);
}

module.exports = { create, list, getById };
