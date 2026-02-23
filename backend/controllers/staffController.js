const staffService = require('../services/staffService');

async function getStats(req, res) {
  const data = await staffService.getStats();
  res.json(data);
}

async function getOrders(req, res) {
  const orders = await staffService.getOrders({ status: req.query.status, search: req.query.search });
  res.json(orders);
}

async function updateOrderStatus(req, res) {
  const result = await staffService.updateOrderStatus(parseInt(req.params.id, 10), req.body.status);
  if (!result.ok) return res.status(400).json({});
  res.json({ message: 'Đã cập nhật', status: req.body.status });
}

async function listProducts(req, res) {
  const rows = await staffService.listProducts();
  res.json(rows);
}

async function createProduct(req, res) {
  const product = await staffService.createProduct(req.body);
  res.status(201).json(product);
}

async function getProduct(req, res) {
  const product = await staffService.getProductById(parseInt(req.params.id, 10));
  if (!product) return res.status(404).json({});
  res.json(product);
}

async function updateProduct(req, res) {
  const product = await staffService.updateProduct(parseInt(req.params.id, 10), req.body);
  if (!product) return res.status(404).json({});
  res.json(product);
}

async function deleteProduct(req, res) {
  await staffService.deleteProduct(parseInt(req.params.id, 10));
  res.json({});
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
};
