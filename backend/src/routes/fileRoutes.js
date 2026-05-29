const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { importFile } = require('../controllers/fileController');
const axios = require('axios');
const FormData = require('form-data');

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

const memoryUpload = multer({ storage: multer.memoryStorage() });

const uploadToPinata = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Vui lòng chọn file' });

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    // Gọi lên Pinata
    const pinataRes = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      maxBodyLength: 'Infinity',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY || process.env.PINATA_API_SECRET,
      },
    });

    const ipfsHash = pinataRes.data.IpfsHash; 
    
    // Trả về cả url (cho page.tsx của bạn) và IpfsHash (cho IPFSUploader của đồng đội)
    res.status(200).json({ 
      success: true, 
      url: ipfsHash, 
      IpfsHash: ipfsHash 
    });

  } catch (error) {
    console.error('Lỗi IPFS:', error?.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Lỗi tải ảnh lên IPFS' });
  }
};

router.post('/upload-image', memoryUpload.single('image'), uploadToPinata); // Dành cho page.tsx của bạn
router.post('/upload-ipfs', memoryUpload.single('file'), uploadToPinata);   // Dành cho IPFSUploader của đồng đội

module.exports = router;
