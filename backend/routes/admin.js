const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const adminService = require('../services/adminService');

const router = express.Router();
router.use(auth);
router.use(adminOnly);

router.get('/stats', async (req, res) => {
  const data = await adminService.getStats();
  res.json(data);
});

router.get('/orders', async (req, res) => {
  const orders = await adminService.getOrders({
    status: req.query.status,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
    search: req.query.search,
  });
  res.json(orders);
});

router.patch('/orders/:id/status', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body;
  const result = await adminService.updateOrderStatus(id, status);
  if (!result.ok && !result.notFound) return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
  if (!result.ok && result.notFound) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
  res.json({ message: 'Đã cập nhật', status });
});

router.get('/products', async (req, res) => {
  const rows = await adminService.listProducts();
  res.json(rows);
});

router.post('/products', async (req, res) => {
  try {
    const product = await adminService.createProduct(req.body);
    res.status(201).json(product);
  } catch (e) {
    if (e.message === 'BadRequest') return res.status(400).json({ message: 'Thiếu tên hoặc danh mục' });
    throw e;
  }
});

router.get('/products/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const product = await adminService.getProductById(id);
  if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  res.json(product);
});

router.patch('/products/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const product = await adminService.updateProduct(id, req.body);
  if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  res.json(product);
});

router.delete('/products/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await adminService.deleteProduct(id);
  res.json({ message: 'Đã xóa sản phẩm' });
});

router.get('/categories', async (req, res) => {
  const rows = await adminService.listCategories();
  res.json(rows);
});

router.post('/categories', async (req, res) => {
  try {
    const category = await adminService.createCategory(req.body);
    res.status(201).json(category);
  } catch (e) {
    if (e.message === 'BadRequest') return res.status(400).json({ message: 'Thiếu tên danh mục' });
    throw e;
  }
});

router.patch('/categories/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const category = await adminService.updateCategory(id, req.body);
  if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
  res.json(category);
});

router.delete('/categories/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    await adminService.deleteCategory(id);
    res.json({ message: 'Đã xóa danh mục' });
  } catch (e) {
    if (e.message === 'CategoryInUse') return res.status(400).json({});
    throw e;
  }
});

router.get('/users', async (req, res) => {
  const rows = await adminService.listUsers();
  res.json(rows);
});

router.patch('/users/:id/role', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { role } = req.body;
  const ok = await adminService.updateUserRole(id, role, req.user.id);
  if (!ok) return res.status(400).json({});
  res.json({ message: 'Đã cập nhật role', role });
});

module.exports = router;
