const { ethers } = require('ethers');
const dotenv = require('dotenv');
dotenv.config();

// VTSCEscrow ABI — updated for signDocument flow (0 ETH, gas-only)
const VTSC_ESCROW_ABI = [
  // Read
  "function getContract(string memory _id) external view returns (tuple(string id, address vtsc, address client, uint256 value, string documentHash, string ipfsCid, uint256 slaDeadline, uint8 status, address signedBy, uint256 signedAt))",
  // Write
  "function createContract(string memory _id, address _client, uint256 _value, uint256 _slaDeadline, string memory _documentHash) external",
  "function signDocument(string memory _id, string memory _documentHash, string memory _ipfsCid) external",
  "function updateDeliveryStatus(string memory _id) external",
  "function confirmCompletion(string memory _id) external",
  "function cancelContract(string memory _id) external",
  // Events
  "event ContractCreated(string id, address vtsc, address client, uint256 value)",
  "event DocumentSigned(string id, address signer, string documentHash, string ipfsCid)",
  "event StatusUpdated(string id, uint8 newStatus)"
];

// Status enum mapping (matches Solidity — updated)
const STATUS_LABELS = [
  'Created',     // 0
  'Signed',      // 1
  'Delivering',  // 2
  'Completed',   // 3
  'Disputed',    // 4
  'Cancelled'    // 5
];

let provider = null;
let contract = null;
let systemWallet = null;

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

    // Khởi tạo systemWallet từ SYSTEM_PRIVATE_KEY (ví hệ thống trả phí gas cho mọi giao dịch)
    const privateKey = process.env.SYSTEM_PRIVATE_KEY;
    if (privateKey) {
      systemWallet = new ethers.Wallet(privateKey, provider);
      // Kết nối Smart Contract với systemWallet thay vì một provider ẩn danh để có quyền ghi dữ liệu
      contract = new ethers.Contract(contractAddress, VTSC_ESCROW_ABI, systemWallet);
      console.log(`[Blockchain] Connected to contract at ${contractAddress} with system wallet`);
    } else {
      console.warn('[Blockchain] WARNING: SYSTEM_PRIVATE_KEY not set. Contract is read-only.');
      contract = new ethers.Contract(contractAddress, VTSC_ESCROW_ABI, provider);
    }

    return true;
  } catch (error) {
    console.error('[Blockchain] Init error:', error.message);
    return false;
  }
}

/**
 * Get on-chain contract data by ID
 * @param {string} contractId — e.g. "CTR-2024-001"
 * @returns {object}
 */
async function getContractStatus(contractId) {
  if (!contract) {
    return {
      mock: true,
      id: contractId,
      vtsc: '0x0000000000000000000000000000000000000000',
      client: '0x0000000000000000000000000000000000000000',
      value: '0',
      documentHash: '',
      ipfsCid: '',
      slaDeadline: 0,
      status: 0,
      statusLabel: 'Not Deployed',
      signedBy: '0x0000000000000000000000000000000000000000',
      signedAt: 0
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
      documentHash: data.documentHash,
      ipfsCid: data.ipfsCid,
      slaDeadline: Number(data.slaDeadline),
      status: Number(data.status),
      statusLabel: STATUS_LABELS[Number(data.status)] || 'Unknown',
      signedBy: data.signedBy,
      signedAt: Number(data.signedAt)
    };
  } catch (error) {
    console.error('[Blockchain] getContractStatus error:', error.message);
    throw new Error(`Failed to read on-chain data for contract ${contractId}`);
  }
}

/**
 * Tạo hợp đồng mới on-chain (VTSC Admin gọi).
 * Value = giá trị ghi nhận, KHÔNG chuyển ETH.
 *
 * @param {string} contractId — Mã hợp đồng "CTR-YYYY-XXX"
 * @param {string} clientAddress — Địa chỉ ví MetaMask của khách B2B
 * @param {string} valueVnd — Giá trị hợp đồng (VNĐ) — chuyển sang Wei để ghi nhận
 * @param {number} slaTimestamp — Unix timestamp hạn SLA
 * @param {string} documentHash — Mã băm SHA-256 của PDF
 * @returns {{ txHash: string, contractAddress: string }}
 */
async function createContractOnChain(contractId, clientAddress, valueVnd, slaTimestamp, documentHash) {
  if (!contract) {
    // Mock mode
    const mockTxHash = '0xmock' + Date.now().toString(16) + Math.random().toString(16).slice(2, 10);
    return {
      mock: true,
      txHash: mockTxHash,
      contractAddress: process.env.CONTRACT_ADDRESS || '0xMockContractAddress'
    };
  }

  try {
    // contract đã được kết nối với systemWallet trong hàm initBlockchain()
    // Do đó có thể gọi trực tiếp các hàm write
    const contractWithSigner = contract;

    // Chuyển giá trị VNĐ sang Wei (1 VNĐ = 1 Wei cho mục đích ghi nhận)
    // Dùng Math.round để tránh lỗi số thập phân do Javascript floating point (ví dụ: 16200000.000000002)
    const safeValueVnd = Math.round(Number(valueVnd)).toString();
    const valueWei = ethers.parseUnits(safeValueVnd, 0);
    
    // Lowercase address to bypass ethers.js strict checksum validation for mixed-case user inputs
    const formattedClientAddress = clientAddress ? clientAddress.toLowerCase() : clientAddress;

    const tx = await contractWithSigner.createContract(
      contractId,
      formattedClientAddress,
      valueWei,
      slaTimestamp,
      documentHash || ''
    );

    const receipt = await tx.wait();

    return {
      mock: false,
      txHash: receipt.hash,
      contractAddress: process.env.CONTRACT_ADDRESS
    };
  } catch (error) {
    console.error('[Blockchain] createContractOnChain error:', error.message);
    throw new Error(`Failed to create contract on-chain: ${error.message}`);
  }
}

// Auto-initialize on require
initBlockchain();

module.exports = {
  provider,
  contract,
  initBlockchain,
  getContractStatus,
  createContractOnChain,
  STATUS_LABELS,
  VTSC_ESCROW_ABI
};