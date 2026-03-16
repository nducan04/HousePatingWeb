const express = require('express');
const { getRDTests, createRDTest, addVersion, techSignOff } = require('../controllers/rdController');

const router = express.Router();

router.route('/')
  .get(getRDTests)
  .post(createRDTest);

router.post('/:id/versions', addVersion);
router.patch('/:id/sign', techSignOff);

module.exports = router;
