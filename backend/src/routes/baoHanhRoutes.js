const express = require('express');
const router = express.Router();
const baoHanhController = require('../controllers/baoHanhController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', baoHanhController.getTickets);
router.post('/', baoHanhController.createTicket);
router.get('/:id', baoHanhController.getTicketById);
router.patch('/:id/status', baoHanhController.updateStatus);

module.exports = router;
