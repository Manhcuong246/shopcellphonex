const express = require('express');
const { auth, staffOnly } = require('../middleware/auth');
const staffController = require('../controllers/staffController');

const router = express.Router();
router.use(auth);
router.use(staffOnly);

router.get('/stats', staffController.getStats);
router.get('/orders', staffController.getOrders);
router.patch('/orders/:id/status', staffController.updateOrderStatus);
router.get('/products', staffController.listProducts);
router.post('/products', staffController.createProduct);
router.get('/products/:id', staffController.getProduct);
router.patch('/products/:id', staffController.updateProduct);
router.delete('/products/:id', staffController.deleteProduct);

module.exports = router;
