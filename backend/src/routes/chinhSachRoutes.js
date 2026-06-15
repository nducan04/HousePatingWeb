const express = require('express');
const router = express.Router();
const { getPolicies, updatePolicy } = require('../controllers/chinhSachController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(getPolicies)
  .post(protect, authorize('Admin', 'Director'), updatePolicy);

module.exports = router;
