const Contract = require('../models/Contract');
const { getContractStatus } = require('../utils/blockchain');
const { uploadToIPFS } = require('../utils/ipfs');
const fs = require('fs');

// @desc    Get all contracts
// @route   GET /api/contracts
// @access  Public
exports.getContracts = async (req, res) => {
  try {
    const contracts = await Contract.find().populate('customer', 'name code');
    res.status(200).json({ success: true, count: contracts.length, data: contracts });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create new contract (optionally upload PDF to IPFS)
// @route   POST /api/contracts
// @access  Public
exports.createContract = async (req, res) => {
  try {
    // If a file was uploaded, pin it to IPFS first
    if (req.file) {
      const ipfsResult = await uploadToIPFS(req.file.path, req.file.originalname);
      req.body.ipfsCid = ipfsResult.ipfsCid;
      req.body.documentHash = ipfsResult.ipfsCid;
      // Clean up temp file
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }

    const contract = await Contract.create(req.body);
    res.status(201).json({ success: true, data: contract });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Duplicate field value entered' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Sign contract (Off-chain signature logging)
// @route   PATCH /api/contracts/:id/sign
// @access  Public
exports.signContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }

    const { party, signature, txHash } = req.body;
    
    if (party === 'vtsc') {
      contract.vtscSignature = signature;
    } else {
      contract.clientSignature = signature;
    }

    if (txHash) contract.txHash = txHash;

    if (contract.vtscSignature || contract.clientSignature) {
      contract.status = 'awaiting';
    }
    if (contract.vtscSignature && contract.clientSignature) {
      contract.status = 'signed';
    }

    await contract.save();
    res.status(200).json({ success: true, data: contract });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Verify contract status on-chain via ethers.js
// @route   GET /api/contracts/:id/onchain
// @access  Public
exports.verifyOnChain = async (req, res) => {
  try {
    // Find the MongoDB contract to get the on-chain contract ID
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }

    // Use the contract code (e.g. "CTR-2024-001") as the on-chain ID
    const onChainId = contract.contractCode || contract._id.toString();
    const onChainData = await getContractStatus(onChainId);

    res.status(200).json({
      success: true,
      data: {
        mongoId: contract._id,
        contractCode: onChainId,
        mongoStatus: contract.status,
        onChain: onChainData
      }
    });
  } catch (error) {
    console.error('On-chain verification error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to verify on-chain status' });
  }
};
