const express = require('express');
const { auth, staffOnly } = require('../middleware/auth');
const staffService = require('../services/staffService');

const router = express.Router();
router.use(auth);
router.use(staffOnly);

router.get('/stats', async (req, res) => {
  const data = await staffService.getStats();
  res.json(data);
});

router.get('/orders', async (req, res) => {
  const orders = await staffService.getOrders({ status: req.query.status, search: req.query.search });
  res.json(orders);
});

router.patch('/orders/:id/status', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body;
  const result = await staffService.updateOrderStatus(id, status);
  if (!result.ok && !result.notFound) return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
  if (!result.ok && result.notFound) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
  res.json({ message: 'Đã cập nhật', status });
});

router.get('/products', async (req, res) => {
  const rows = await staffService.listProducts();
  res.json(rows);
});

router.post('/products', async (req, res) => {
  try {
    const product = await staffService.createProduct(req.body);
    res.status(201).json(product);
  } catch (e) {
    if (e.message === 'BadRequest') return res.status(400).json({ message: 'Thiếu tên hoặc danh mục' });
    throw e;
  }
});

router.get('/products/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const product = await staffService.getProductById(id);
  if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  res.json(product);
});

router.patch('/products/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const product = await staffService.updateProduct(id, req.body);
  if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  res.json(product);
});

router.delete('/products/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await staffService.deleteProduct(id);
  res.json({ message: 'Đã xóa sản phẩm' });
});

module.exports = router;
