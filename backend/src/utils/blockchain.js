const { ethers } = require('ethers');
const dotenv = require('dotenv');
dotenv.config();

// VTSCEscrow ABI — minimal interface for backend interaction
const VTSC_ESCROW_ABI = [
  "function getContract(string memory _id) external view returns (tuple(string id, address vtsc, address client, uint256 value, uint256 escrowAmount, string documentHash, uint256 slaDeadline, uint8 status))",
  "function createContract(string memory _id, address _client, uint256 _value, uint256 _escrowAmount, uint256 _slaDeadline, string memory _documentHash) external",
  "event ContractCreated(string id, address vtsc, address client, uint256 value)",
  "event EscrowFunded(string id, uint256 amount)",
  "event ContractSigned(string id)",
  "event DeliveryConfirmed(string id)",
  "event PenaltyApplied(string id, uint256 penaltyAmount)"
];

// Status enum mapping (matches Solidity)
const STATUS_LABELS = [
  'Created',    // 0
  'Funded',     // 1
  'Signed',     // 2
  'Delivering', // 3
  'Completed',  // 4
  'Disputed',   // 5
  'Penalized'   // 6
];

let provider = null;
let contract = null;

/**
 * Initialize blockchain provider and contract instance.
 * Returns false if env vars are missing (allows graceful mock fallback).
 */
function initBlockchain() {
  try {
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!rpcUrl || !contractAddress || contractAddress === 'deployed_contract_address_here') {
      console.log('[Blockchain] Not configured — using mock mode. Set SEPOLIA_RPC_URL and CONTRACT_ADDRESS in .env');
      return false;
    }

    provider = new ethers.JsonRpcProvider(rpcUrl);
    contract = new ethers.Contract(contractAddress, VTSC_ESCROW_ABI, provider);
    console.log(`[Blockchain] Connected to contract at ${contractAddress}`);
    return true;
  } catch (error) {
    console.error('[Blockchain] Init error:', error.message);
    return false;
  }
}

/**
 * Get on-chain contract data by ID
 * @param {string} contractId — e.g. "CTR-2024-001"
 * @returns {object} — { id, vtsc, client, value, escrowAmount, documentHash, slaDeadline, status, statusLabel }
 */
async function getContractStatus(contractId) {
  if (!contract) {
    // Return mock data when blockchain not configured
    return {
      mock: true,
      id: contractId,
      vtsc: '0x0000000000000000000000000000000000000000',
      client: '0x0000000000000000000000000000000000000000',
      value: '0',
      escrowAmount: '0',
      documentHash: '',
      slaDeadline: 0,
      status: 0,
      statusLabel: 'Not Deployed'
    };
  }

  try {
    const data = await contract.getContract(contractId);
    return {
      mock: false,
      id: data.id,
      vtsc: data.vtsc,
      client: data.client,
      value: ethers.formatEther(data.value),
      escrowAmount: ethers.formatEther(data.escrowAmount),
      documentHash: data.documentHash,
      slaDeadline: Number(data.slaDeadline),
      status: Number(data.status),
      statusLabel: STATUS_LABELS[Number(data.status)] || 'Unknown'
    };
  } catch (error) {
    console.error('[Blockchain] getContractStatus error:', error.message);
    throw new Error(`Failed to read on-chain data for contract ${contractId}`);
  }
}

/**
 * Create a wallet signer for write operations (deploy, create contract, etc.)
 * @returns {ethers.Wallet} signer
 */
function getSigner() {
  if (!provider) {
    throw new Error('Blockchain not initialized');
  }
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('DEPLOYER_PRIVATE_KEY not set in .env');
  }
  return new ethers.Wallet(privateKey, provider);
}

// Auto-initialize on require
initBlockchain();

module.exports = {
  provider,
  contract,
  initBlockchain,
  getContractStatus,
  getSigner,
  STATUS_LABELS,
  VTSC_ESCROW_ABI
};
