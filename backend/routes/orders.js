const express = require('express');
const { auth } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

const router = express.Router();
router.use(auth);

router.post('/', orderController.create);
router.get('/', orderController.list);
router.get('/:id', orderController.getById);

module.exports = router;
