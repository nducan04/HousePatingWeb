const express = require('express');
const router = express.Router();
const rdController = require('../controllers/rdController');

router.get('/', rdController.getRDLogs);
router.get('/:id', rdController.getRDLogById);
router.post('/', rdController.createRDLog);
router.post('/:id/versions', rdController.addVersion);
router.patch('/:id/sign-kcs', rdController.signKCS);

module.exports = router;
