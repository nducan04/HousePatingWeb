const express = require('express');
const { getContracts, createContract, signContract, verifyOnChain } = require('../controllers/contractController');

const router = express.Router();

router.route('/')
  .get(getContracts)
  .post(createContract);

router.patch('/:id/sign', signContract);
router.get('/:id/onchain', verifyOnChain);

module.exports = router;
