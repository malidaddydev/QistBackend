const { createProduct, getAllProducts, getProductById, getProductByName, toggleProductField } = require('../controllers/productController');
const upload = require('../middlewares/uploadMiddleware');
const express = require('express');
const router = express.Router();

router.post('/create-product', upload.array('files'), createProduct);
router.get('/product', getAllProducts);
router.get('/product/:id', getProductById);
router.get('/product/name/:name', getProductByName);
router.patch('/products/:id/toggle', toggleProductField);

module.exports = router;