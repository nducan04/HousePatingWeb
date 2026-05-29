const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

let pinata = null;

/**
 * Initialize Pinata client
 */
function initPinata() {
  try {
    const apiKey = process.env.PINATA_API_KEY;
    const secretKey = process.env.PINATA_SECRET_KEY || process.env.PINATA_API_SECRET;

    if (!apiKey || !secretKey || apiKey === 'your_pinata_api_key') {
      console.log('[IPFS] Pinata not configured — uploads will return mock CIDs. Set PINATA_API_KEY and PINATA_SECRET_KEY in .env');
      return false;
    }

    pinata = new pinataSDK(apiKey, secretKey);
    console.log('[IPFS] Pinata SDK initialized');
    return true;
  } catch (error) {
    console.error('[IPFS] Init error:', error.message);
    return false;
  }
}

/**
 * Upload a file to IPFS via Pinata
 * @param {string} filePath — absolute/relative path to the file
 * @param {string} [fileName] — optional display name
 * @returns {object} — { ipfsCid, url, pinSize, timestamp }
 */
async function uploadToIPFS(filePath, fileName) {
  const name = fileName || path.basename(filePath);

  // Mock response when Pinata not configured
  if (!pinata) {
    const mockCid = 'QmMock' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    return {
      mock: true,
      ipfsCid: mockCid,
      url: `https://gateway.pinata.cloud/ipfs/${mockCid}`,
      pinSize: 0,
      timestamp: new Date().toISOString(),
      fileName: name
    };
  }

  try {
    const readableStream = fs.createReadStream(filePath);
    const options = {
      pinataMetadata: { name },
      pinataOptions: { cidVersion: 0 }
    };

    const result = await pinata.pinFileToIPFS(readableStream, options);

    return {
      mock: false,
      ipfsCid: result.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      pinSize: result.PinSize,
      timestamp: result.Timestamp,
      fileName: name
    };
  } catch (error) {
    console.error('[IPFS] Upload error:', error.message);
    throw new Error(`Failed to upload ${name} to IPFS: ${error.message}`);
  }
}

/**
 * Test Pinata connection
 * @returns {boolean}
 */
async function testConnection() {
  if (!pinata) return false;
  try {
    const result = await pinata.testAuthentication();
    return result.authenticated === true;
  } catch {
    return false;
  }
}

// Auto-initialize
initPinata();

module.exports = {
  uploadToIPFS,
  testConnection,
  initPinata
};
