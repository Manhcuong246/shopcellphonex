const cartService = require('../services/cartService');

async function getCart(req, res) {
  const rows = await cartService.getCart(req.user.id);
  res.json(rows);
}

async function addItem(req, res) {
  const item = await cartService.addItem(req.user.id, req.body);
  if (!item) return res.status(400).json({});
  res.json(item);
}

async function removeItem(req, res) {
  await cartService.removeItem(req.user.id, req.params.variantId);
  res.json({});
}

async function updateItem(req, res) {
  await cartService.updateItem(req.user.id, req.params.variantId, req.body.quantity);
  res.json({});
}

module.exports = { getCart, addItem, removeItem, updateItem };
