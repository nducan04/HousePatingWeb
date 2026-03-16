const express = require('express');
const { getProducts, getProduct, createProduct, updateProduct } = require('../controllers/productController');

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(createProduct);

router.route('/:id')
  .get(getProduct)
  .put(updateProduct);

module.exports = router;
