const express = require('express');
const { uploadToIPFS, uploadMiddleware } = require('../controllers/ipfsController');

const router = express.Router();

router.post('/upload', uploadMiddleware, uploadToIPFS);

module.exports = router;
