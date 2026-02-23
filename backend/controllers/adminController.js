const adminService = require('../services/adminService');

async function getStats(req, res) {
  const data = await adminService.getStats();
  res.json(data);
}

async function getOrders(req, res) {
  const orders = await adminService.getOrders({
    status: req.query.status,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
    search: req.query.search,
  });
  res.json(orders);
}

async function updateOrderStatus(req, res) {
  const result = await adminService.updateOrderStatus(parseInt(req.params.id, 10), req.body.status);
  if (!result.ok) return res.status(400).json({});
  res.json({ message: 'Đã cập nhật', status: req.body.status });
}

async function listProducts(req, res) {
  const rows = await adminService.listProducts();
  res.json(rows);
}

async function createProduct(req, res) {
  const product = await adminService.createProduct(req.body);
  res.status(201).json(product);
}

async function getProduct(req, res) {
  const product = await adminService.getProductById(parseInt(req.params.id, 10));
  if (!product) return res.status(404).json({});
  res.json(product);
}

async function updateProduct(req, res) {
  const product = await adminService.updateProduct(parseInt(req.params.id, 10), req.body);
  if (!product) return res.status(404).json({});
  res.json(product);
}

async function deleteProduct(req, res) {
  await adminService.deleteProduct(parseInt(req.params.id, 10));
  res.json({});
}

async function listCategories(req, res) {
  const rows = await adminService.listCategories();
  res.json(rows);
}

async function createCategory(req, res) {
  const category = await adminService.createCategory(req.body);
  res.status(201).json(category);
}

async function updateCategory(req, res) {
  const category = await adminService.updateCategory(parseInt(req.params.id, 10), req.body);
  if (!category) return res.status(404).json({});
  res.json(category);
}

async function deleteCategory(req, res) {
  await adminService.deleteCategory(parseInt(req.params.id, 10));
  res.json({});
}

async function listUsers(req, res) {
  const rows = await adminService.listUsers();
  res.json(rows);
}

async function updateUserRole(req, res) {
  const ok = await adminService.updateUserRole(parseInt(req.params.id, 10), req.body.role, req.user.id);
  if (!ok) return res.status(400).json({});
  res.json({ message: 'Đã cập nhật role', role: req.body.role });
}

module.exports = {
  getStats,
  getOrders,
  updateOrderStatus,
  listProducts,
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listUsers,
  updateUserRole,
};
