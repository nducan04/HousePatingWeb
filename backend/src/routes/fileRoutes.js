const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { importFile, uploadImage } = require('../controllers/fileController');

// Configure Multer for File Uploads
const st = multer.diskStorage({
  destination: function (req, file, cb) {
      const uploadDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
    storage: st,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.csv' || ext === '.xls' || ext === '.xlsx') {
            cb(null, true);
        } else {
            cb(new Error('Chỉ hỗ trợ file Excel (.xlsx, .xls) hoặc CSV.'));
        }
    }
});

// POST /api/files/import
router.post('/import', upload.single('file'), importFile);

const imageUpload = multer({ 
    storage: st,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp', '.svg', '.pdf', '.doc', '.docx'].includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ hỗ trợ file ảnh hoặc tài liệu (.pdf, .doc).'));
        }
    }
});

// POST /api/files/upload-image
router.post('/upload-image', imageUpload.single('image'), uploadImage);

module.exports = router;
