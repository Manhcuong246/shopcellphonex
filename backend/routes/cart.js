const express = require('express');
const { auth } = require('../middleware/auth');
const cartController = require('../controllers/cartController');

const router = express.Router();
router.use(auth);

router.get('/', cartController.getCart);
router.post('/', cartController.addItem);
router.delete('/:variantId', cartController.removeItem);
router.patch('/:variantId', cartController.updateItem);

module.exports = router;
