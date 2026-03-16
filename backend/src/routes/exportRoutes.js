const express = require('express');
const router = express.Router();
const { exportCustomersExcel, exportTargetsExcel, generateContractPDF } = require('../controllers/exportController');

// GET /api/export/customers/excel
router.get('/customers/excel', exportCustomersExcel);

// GET /api/export/targets/excel
router.get('/targets/excel', exportTargetsExcel);

// GET /api/export/contracts/:contractId/pdf (using GET so it works easily via browser download link anchor)
router.get('/contracts/:contractId/pdf', generateContractPDF);

module.exports = router;
