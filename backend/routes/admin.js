const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();
router.use(auth);
router.use(adminOnly);

router.get('/stats', adminController.getStats);
router.get('/orders', adminController.getOrders);
router.patch('/orders/:id/status', adminController.updateOrderStatus);
router.get('/products', adminController.listProducts);
router.post('/products', adminController.createProduct);
router.get('/products/:id', adminController.getProduct);
router.patch('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);
router.get('/categories', adminController.listCategories);
router.post('/categories', adminController.createCategory);
router.patch('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);
router.get('/users', adminController.listUsers);
router.patch('/users/:id/role', adminController.updateUserRole);

module.exports = router;
