const express = require('express');
const { getCustomers, getCustomer, createCustomer, updateCustomer } = require('../controllers/customerController');

const router = express.Router();

router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.route('/:id')
  .get(getCustomer)
  .put(updateCustomer);

module.exports = router;
