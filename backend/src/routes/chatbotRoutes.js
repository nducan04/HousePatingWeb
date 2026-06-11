const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getChatbotResponse, getChatHistory, getTickets, replyTicket, resolveColor } = require('../controllers/chatbotController');

// Public: chat message + history (session-based, no auth needed for B2C portal)
router.post('/message', getChatbotResponse);
router.get('/history/:sessionId', getChatHistory);
router.post('/resolve-color', resolveColor);

// Protected: ticket management (CSKH / Admin)
router.get('/tickets', protect, authorize('Admin', 'NhanVien'), getTickets);
router.post('/tickets/:ticketId/reply', protect, authorize('Admin', 'NhanVien'), replyTicket);

module.exports = router;
