const { createProduct, getAllProducts, getProductById } = require('../controllers/productController');
const upload = require('../middlewares/uploadMiddleware');
const express = require('express');
const router = express.Router();

router.post('/create-product', upload.array('files'), createProduct);
router.get('/product', getAllProducts);
router.get('/product/:id', getProductById);

module.exports = router;