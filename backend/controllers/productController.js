const productService = require('../services/productService');

async function list(req, res) {
  const rows = await productService.list(req.query);
  res.json(rows);
}

async function getCartInfo(req, res) {
  const rows = await productService.getCartInfo(req.query.variant_ids);
  res.json(rows);
}

async function getComments(req, res) {
  const rows = await productService.getComments(req.params.slug);
  res.json(rows);
}

async function addComment(req, res) {
  const comment = await productService.addComment(req.params.slug, req.user.id, req.body);
  if (!comment) return res.status(404).json({});
  res.status(201).json(comment);
}

async function getBySlug(req, res) {
  const product = await productService.getBySlug(req.params.slug);
  if (!product) return res.status(404).json({});
  res.json(product);
}

module.exports = { list, getCartInfo, getComments, addComment, getBySlug };
