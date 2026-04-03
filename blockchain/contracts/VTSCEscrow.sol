// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title VTSCEscrow - Quản lý Hợp đồng Nguyên tắc B2B trên Blockchain
 * @notice Hệ thống VTSC sử dụng cơ chế công nợ truyền thống (fiat).
 *         Smart Contract này chỉ ghi nhận bằng chứng pháp lý bất biến,
 *         KHÔNG xử lý chuyển tiền ETH giữa các bên.
 */
contract VTSCEscrow {
    address public owner;

    enum ContractStatus { Created, Signed, Delivering, Completed, Disputed, Cancelled }

    struct ContractData {
        string id;
        address vtsc;
        address client;
        uint256 value;          // Giá trị hợp đồng (đơn vị: Wei, dùng cho ghi nhận, không chuyển tiền)
        string documentHash;    // Mã băm SHA-256 của file PDF gốc
        string ipfsCid;         // Mã CID trên IPFS (Pinata)
        uint256 slaDeadline;    // Hạn SLA giao hàng (Unix timestamp)
        ContractStatus status;
        address signedBy;       // Địa chỉ ví đã ký xác nhận
        uint256 signedAt;       // Thời điểm ký (block.timestamp)
    }

    mapping(string => ContractData) public contracts;

    event ContractCreated(string id, address vtsc, address client, uint256 value);
    event DocumentSigned(string id, address signer, string documentHash, string ipfsCid);
    event StatusUpdated(string id, ContractStatus newStatus);

    modifier onlyVTSC(string memory _id) {
        require(msg.sender == contracts[_id].vtsc, "Only VTSC can perform this action");
        _;
    }

    modifier onlyParty(string memory _id) {
        require(
            msg.sender == contracts[_id].vtsc || msg.sender == contracts[_id].client,
            "Only contract parties can perform this action"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev VTSC Admin tạo hợp đồng mới trên Blockchain.
     *      Value chỉ để ghi nhận giá trị, KHÔNG chuyển ETH.
     */
    function createContract(
        string memory _id,
        address _client,
        uint256 _value,
        uint256 _slaDeadline,
        string memory _documentHash
    ) external {
        require(contracts[_id].vtsc == address(0), "Contract already exists");
        require(_client != address(0), "Invalid client address");

        contracts[_id] = ContractData({
            id: _id,
            vtsc: msg.sender,
            client: _client,
            value: _value,
            documentHash: _documentHash,
            ipfsCid: "",
            slaDeadline: _slaDeadline,
            status: ContractStatus.Created,
            signedBy: address(0),
            signedAt: 0
        });

        emit ContractCreated(_id, msg.sender, _client, _value);
    }

    /**
     * @dev Ký xác nhận hợp đồng on-chain (state-changing, 0 ETH value).
     *      Giao dịch này tốn Gas để ghi dữ liệu lên Blockchain,
     *      nhưng Value chuyển đi = 0 ETH.
     *      TX Hash sinh ra là bằng chứng pháp lý bất biến trên Sepolia.
     *
     * @param _id Mã hợp đồng nội bộ
     * @param _documentHash Mã băm SHA-256 của bản PDF hợp đồng gốc
     * @param _ipfsCid Mã CID trả về từ IPFS/Pinata
     */
    function signDocument(
        string memory _id,
        string memory _documentHash,
        string memory _ipfsCid
    ) external onlyParty(_id) {
        require(contracts[_id].status == ContractStatus.Created, "Contract must be in Created state");

        contracts[_id].documentHash = _documentHash;
        contracts[_id].ipfsCid = _ipfsCid;
        contracts[_id].status = ContractStatus.Signed;
        contracts[_id].signedBy = msg.sender;
        contracts[_id].signedAt = block.timestamp;

        emit DocumentSigned(_id, msg.sender, _documentHash, _ipfsCid);
    }

    /**
     * @dev VTSC cập nhật trạng thái giao hàng
     */
    function updateDeliveryStatus(string memory _id) external onlyVTSC(_id) {
        require(contracts[_id].status == ContractStatus.Signed, "Contract must be Signed first");
        contracts[_id].status = ContractStatus.Delivering;
        emit StatusUpdated(_id, ContractStatus.Delivering);
    }

    /**
     * @dev Xác nhận hoàn tất giao hàng & nghiệm thu
     */
    function confirmCompletion(string memory _id) external onlyParty(_id) {
        require(
            contracts[_id].status == ContractStatus.Signed || contracts[_id].status == ContractStatus.Delivering,
            "Invalid status for completion"
        );
        contracts[_id].status = ContractStatus.Completed;
        emit StatusUpdated(_id, ContractStatus.Completed);
    }

    /**
     * @dev Đánh dấu hợp đồng tranh chấp khi vi phạm SLA
     */
    function raiseDispute(string memory _id) external onlyParty(_id) {
        require(
            contracts[_id].status == ContractStatus.Signed || contracts[_id].status == ContractStatus.Delivering,
            "Invalid status for dispute"
        );
        require(block.timestamp > contracts[_id].slaDeadline, "SLA deadline not yet reached");

        contracts[_id].status = ContractStatus.Disputed;
        emit StatusUpdated(_id, ContractStatus.Disputed);
    }

    /**
     * @dev Hủy hợp đồng (chỉ khi chưa ký)
     */
    function cancelContract(string memory _id) external onlyVTSC(_id) {
        require(contracts[_id].status == ContractStatus.Created, "Can only cancel Created contracts");
        contracts[_id].status = ContractStatus.Cancelled;
        emit StatusUpdated(_id, ContractStatus.Cancelled);
    }

    /**
     * @dev Truy xuất dữ liệu hợp đồng on-chain
     */
    function getContract(string memory _id) external view returns (ContractData memory) {
        return contracts[_id];
    }
}
