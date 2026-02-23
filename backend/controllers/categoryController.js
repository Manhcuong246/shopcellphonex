const categoryService = require('../services/categoryService');

async function list(req, res) {
  const rows = await categoryService.list();
  res.json(rows);
}

module.exports = { list };
