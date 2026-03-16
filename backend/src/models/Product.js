const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  colorCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  colorName: {
    type: String,
    required: true,
    trim: true
  },
  hex: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Metallic', 'Solid', 'Texture'],
    required: true
  },
  gloss: {
    type: String,
    required: true
  },
  surface: {
    type: String,
    required: true
  },
  application: {
    type: String
  },
  msdsUrl: {
    type: String
  },
  ipfsCid: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
