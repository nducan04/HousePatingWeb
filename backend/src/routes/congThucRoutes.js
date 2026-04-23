const express = require('express');
const router = express.Router();
const congThucController = require('../controllers/congThucController');

router.get('/', congThucController.getFormulas);
router.post('/', congThucController.createFormula);
router.post('/:id/calculate', congThucController.calculateRequirement);

module.exports = router;
