const mongoose = require('mongoose');

const aiChatSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  messages: [
    {
      role: { type: String, enum: ['user', 'model'] },
      content: { type: String },
      timestamp: { type: Date, default: Date.now }
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model('AiChatSession', aiChatSessionSchema, 'AiChatSessions');
