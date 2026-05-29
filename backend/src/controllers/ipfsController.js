const multer = require('multer');
const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

// Try to initialize Pinata, but don't crash if keys are missing (allow local testing)
let pinata;
try {
  const secretKey = process.env.PINATA_SECRET_KEY || process.env.PINATA_API_SECRET;
  if (process.env.PINATA_API_KEY && secretKey
      && process.env.PINATA_API_KEY !== 'your_pinata_api_key') {
    pinata = new pinataSDK(process.env.PINATA_API_KEY, secretKey);
  }
} catch (e) {
  console.log("Pinata not fully configured. IPFS uploads will return mock CIDs.");
}

const { Readable } = require('stream');

// Use memory storage to avoid triggering node --watch restarts when writing to disk
const upload = multer({ storage: multer.memoryStorage() });

exports.uploadMiddleware = upload.single('file');

exports.uploadToIPFS = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Fallback response if IPFS not configured (Returns Base64 Data URI)
    if (!pinata) {
      const base64Image = req.file.buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${base64Image}`;
      
      return res.status(200).json({ 
        success: true, 
        mock: true,
        data: {
          ipfsCid: dataUri,
          url: dataUri,
          fileName: req.file.originalname
        } 
      });
    }

    // Convert buffer to Readable stream
    const readableStreamForFile = Readable.from(req.file.buffer);
    // Pinata SDK may rely on the path property for the filename if not provided in options
    readableStreamForFile.path = req.file.originalname;

    const options = {
        pinataMetadata: {
            name: req.file.originalname,
        }
    };
    
    // Both SDK v2 and v3 support pinning from stream/fs in node
    const result = await pinata.pinFileToIPFS(readableStreamForFile, options);

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
    res.status(500).json({ success: false, error: 'Failed to upload to IPFS' });
  }
};
