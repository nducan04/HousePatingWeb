// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract VTSCEscrow {
    address public owner;

    enum ContractStatus { Created, Funded, Signed, Delivering, Completed, Disputed, Penalized }

    struct ContractData {
        string id;
        address vtsc;
        address client;
        uint256 value;
        uint256 escrowAmount;
        string documentHash;
        uint256 slaDeadline;
        ContractStatus status;
    }

    mapping(string => ContractData) public contracts;

    event ContractCreated(string id, address vtsc, address client, uint256 value);
    event EscrowFunded(string id, uint256 amount);
    event ContractSigned(string id);
    event DeliveryConfirmed(string id);
    event PenaltyApplied(string id, uint256 penaltyAmount);

    modifier onlyVTSC(string memory _id) {
        require(msg.sender == contracts[_id].vtsc, "Only VTSC can perform this action");
        _;
    }

    modifier onlyClient(string memory _id) {
        require(msg.sender == contracts[_id].client, "Only Client can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Create a new contract
     */
    function createContract(
        string memory _id,
        address _client,
        uint256 _value,
        uint256 _escrowAmount,
        uint256 _slaDeadline,
        string memory _documentHash
    ) external {
        require(contracts[_id].vtsc == address(0), "Contract already exists");
        
        contracts[_id] = ContractData({
            id: _id,
            vtsc: msg.sender,
            client: _client,
            value: _value,
            escrowAmount: _escrowAmount,
            documentHash: _documentHash,
            slaDeadline: _slaDeadline,
            status: ContractStatus.Created
        });

        emit ContractCreated(_id, msg.sender, _client, _value);
    }

    /**
     * @dev Client funds the escrow to proceed
     */
    function fundEscrow(string memory _id) external payable onlyClient(_id) {
        require(contracts[_id].status == ContractStatus.Created, "Contract must be in Created state");
        require(msg.value == contracts[_id].escrowAmount, "Must send exact escrow amount");

        contracts[_id].status = ContractStatus.Funded;
        emit EscrowFunded(_id, msg.value);
    }

    /**
     * @dev Client signs indicating agreement with terms and readiness for delivery
     */
    function signContract(string memory _id) external onlyClient(_id) {
        require(contracts[_id].status == ContractStatus.Funded, "Escrow must be funded first");
        
        contracts[_id].status = ContractStatus.Signed;
        emit ContractSigned(_id);
    }

    /**
     * @dev Client confirms delivery, releasing funds to VTSC
     */
    function confirmDelivery(string memory _id) external onlyClient(_id) {
        require(contracts[_id].status == ContractStatus.Signed || contracts[_id].status == ContractStatus.Delivering, "Invalid status for confirmation");
        
        contracts[_id].status = ContractStatus.Completed;
        
        // Transfer escrow to VTSC
        payable(contracts[_id].vtsc).transfer(contracts[_id].escrowAmount);
        
        emit DeliveryConfirmed(_id);
    }

    /**
     * @dev Trigger penalty if VTSC misses SLA. Escrow is returned to client.
     */
    function triggerPenalty(string memory _id) external onlyClient(_id) {
        require(contracts[_id].status == ContractStatus.Signed || contracts[_id].status == ContractStatus.Delivering, "Invalid status for penalty");
        require(block.timestamp > contracts[_id].slaDeadline, "SLA deadline not yet reached");

        contracts[_id].status = ContractStatus.Penalized;
        
        // Return escrow to client as penalty against VTSC
        payable(contracts[_id].client).transfer(contracts[_id].escrowAmount);
        
        emit PenaltyApplied(_id, contracts[_id].escrowAmount);
    }

    /**
     * @dev Get contract summary
     */
    function getContract(string memory _id) external view returns (ContractData memory) {
        return contracts[_id];
    }
}
