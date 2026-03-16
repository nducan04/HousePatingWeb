const multer = require('multer');
const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

// Try to initialize Pinata, but don't crash if keys are missing (allow local testing)
let pinata;
try {
  if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY
      && process.env.PINATA_API_KEY !== 'your_pinata_api_key') {
    pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);
  }
} catch (e) {
  console.log("Pinata not fully configured. IPFS uploads will return mock CIDs.");
}

// Multer config for temporary local storage before IPFS upload
const upload = multer({ dest: 'uploads/' });

exports.uploadMiddleware = upload.single('file');

exports.uploadToIPFS = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Mock response if IPFS not configured
    if (!pinata) {
      const mockCid = 'QmMockHash' + Date.now();
      return res.status(200).json({ 
        success: true, 
        mock: true,
        data: {
          ipfsCid: mockCid,
          url: `https://gateway.pinata.cloud/ipfs/${mockCid}`,
          fileName: req.file.originalname
        } 
      });
    }

    const readableStreamForFile = fs.createReadStream(req.file.path);
    const options = {
        pinataMetadata: {
            name: req.file.originalname,
        }
    };
    
    // Both SDK v2 and v3 support pinning from stream/fs in node
    const result = await pinata.pinFileToIPFS(readableStreamForFile, options);
    
    // Clean up temp file
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      data: {
        ipfsCid: result.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
        size: result.PinSize,
        fileName: req.file.originalname
      }
    });

  } catch (error) {
    console.error('IPFS upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: 'Failed to upload to IPFS' });
  }
};
