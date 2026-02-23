const express = require('express');
const { auth } = require('../middleware/auth');
const productController = require('../controllers/productController');

const router = express.Router();

router.get('/', productController.list);
router.get('/cart-info', productController.getCartInfo);
router.get('/:slug/comments', productController.getComments);
router.post('/:slug/comments', auth, productController.addComment);
router.get('/:slug', productController.getBySlug);

module.exports = router;
