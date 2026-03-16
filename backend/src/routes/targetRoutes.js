const express = require('express');
const { getTargets, createTarget, getAlerts } = require('../controllers/targetController');

const router = express.Router();

router.get('/alerts', getAlerts);

router.route('/')
  .get(getTargets)
  .post(createTarget);

module.exports = router;
