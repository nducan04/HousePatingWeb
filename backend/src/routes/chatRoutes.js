const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/sessions', protect, chatController.getSessions);
router.get('/sessions/:id', protect, chatController.getSessionById);
router.post('/sessions/init', protect, chatController.createOrGetSession);

module.exports = router;
