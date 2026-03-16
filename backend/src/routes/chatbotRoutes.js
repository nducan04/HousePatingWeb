const express = require('express');
const router = express.Router();
const { getChatbotResponse, getChatHistory } = require('../controllers/chatbotController');

// POST /api/chatbot/message
router.post('/message', getChatbotResponse);

// GET /api/chatbot/history/:sessionId
router.get('/history/:sessionId', getChatHistory);

module.exports = router;
