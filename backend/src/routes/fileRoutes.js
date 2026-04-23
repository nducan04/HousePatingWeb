const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { importFile } = require('../controllers/fileController');

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

module.exports = router;
