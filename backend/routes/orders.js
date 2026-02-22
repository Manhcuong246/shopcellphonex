const express = require('express');
const { auth } = require('../middleware/auth');
const orderService = require('../services/orderService');

const router = express.Router();
router.use(auth);

router.post('/', async (req, res) => {
  if (req.user.role === 'admin' || req.user.role === 'staff') {
    return res.status(403).json({ message: 'Tài khoản nhân viên/admin không được đặt hàng' });
  }
  try {
    const order = await orderService.createOrder(req.user.id, req.body);
    res.status(201).json({ message: 'Đặt hàng thành công', order });
  } catch (e) {
    if (e.message === 'BadRequest') return res.status(400).json({ message: 'Thiếu thông tin đơn hàng' });
    if (e.message === 'Stock') return res.status(400).json({ message: 'Sản phẩm không đủ tồn kho' });
    throw e;
  }
});

router.get('/', async (req, res) => {
  const orders = await orderService.getOrdersByUser(req.user.id);
  res.json(orders);
});

router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const order = await orderService.getOrderById(id, req.user.id);
  if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
  res.json(order);
});

module.exports = router;
