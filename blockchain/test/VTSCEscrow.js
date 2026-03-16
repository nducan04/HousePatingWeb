const { expect } = require("chai");
const hre = require("hardhat");

describe("VTSCEscrow", function () {
  let vtscEscrow;
  let owner; // VTSC
  let client;
  const contractId = "CTR-2024-001";
  const docHash = "QmTestHash123456789";
  
  const value = hre.ethers.parseEther("5.0");
  const escrowAmount = hre.ethers.parseEther("1.0");

  beforeEach(async function () {
    [owner, client] = await hre.ethers.getSigners();
    const VTSCEscrowFactory = await hre.ethers.getContractFactory("VTSCEscrow");
    vtscEscrow = await VTSCEscrowFactory.deploy();
  });

  describe("Contract Creation", function () {
    it("Should create a new contract successfully", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 86400; // +1 day
      
      await expect(vtscEscrow.createContract(contractId, client.address, value, escrowAmount, deadline, docHash))
        .to.emit(vtscEscrow, "ContractCreated")
        .withArgs(contractId, owner.address, client.address, value);

      const contractData = await vtscEscrow.getContract(contractId);
      expect(contractData.id).to.equal(contractId);
      expect(contractData.vtsc).to.equal(owner.address);
      expect(contractData.status).to.equal(0); // Created
    });

    it("Should prevent creating duplicate contracts", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      await vtscEscrow.createContract(contractId, client.address, value, escrowAmount, deadline, docHash);
      
      await expect(
        vtscEscrow.createContract(contractId, client.address, value, escrowAmount, deadline, docHash)
      ).to.be.revertedWith("Contract already exists");
    });
  });

  describe("Escrow Funding & Signing", function () {
    let deadline;

    beforeEach(async function () {
      deadline = Math.floor(Date.now() / 1000) + 86400;
      await vtscEscrow.createContract(contractId, client.address, value, escrowAmount, deadline, docHash);
    });

    it("Should allow client to fund the escrow", async function () {
      await expect(vtscEscrow.connect(client).fundEscrow(contractId, { value: escrowAmount }))
        .to.emit(vtscEscrow, "EscrowFunded")
        .withArgs(contractId, escrowAmount);

      const contractData = await vtscEscrow.getContract(contractId);
      expect(contractData.status).to.equal(1); // Funded
    });

    it("Should reject incorrect escrow amount", async function () {
      const wrongAmount = hre.ethers.parseEther("0.5");
      await expect(
        vtscEscrow.connect(client).fundEscrow(contractId, { value: wrongAmount })
      ).to.be.revertedWith("Must send exact escrow amount");
    });

    it("Should allow client to sign after funding", async function () {
      await vtscEscrow.connect(client).fundEscrow(contractId, { value: escrowAmount });
      
      await expect(vtscEscrow.connect(client).signContract(contractId))
        .to.emit(vtscEscrow, "ContractSigned")
        .withArgs(contractId);

      const contractData = await vtscEscrow.getContract(contractId);
      expect(contractData.status).to.equal(2); // Signed
    });

    it("Should reject signing before funding", async function () {
      await expect(
        vtscEscrow.connect(client).signContract(contractId)
      ).to.be.revertedWith("Escrow must be funded first");
    });
  });

  describe("Delivery Confirmation", function () {
    let deadline;

    beforeEach(async function () {
      deadline = Math.floor(Date.now() / 1000) + 86400;
      await vtscEscrow.createContract(contractId, client.address, value, escrowAmount, deadline, docHash);
      await vtscEscrow.connect(client).fundEscrow(contractId, { value: escrowAmount });
      await vtscEscrow.connect(client).signContract(contractId);
    });

    it("Should release escrow to VTSC on delivery confirmation", async function () {
      const initialVtscBalance = await hre.ethers.provider.getBalance(owner.address);

      await expect(vtscEscrow.connect(client).confirmDelivery(contractId))
        .to.emit(vtscEscrow, "DeliveryConfirmed")
        .withArgs(contractId);

      const finalVtscBalance = await hre.ethers.provider.getBalance(owner.address);
      expect(finalVtscBalance).to.be.gt(initialVtscBalance);
      
      const contractData = await vtscEscrow.getContract(contractId);
      expect(contractData.status).to.equal(4); // Completed
    });
  });

  describe("Penalty Mechanism", function () {
    it("Should return escrow to client when SLA violated", async function () {
      // Create contract with deadline in the past
      const pastDeadline = Math.floor(Date.now() / 1000) - 100;
      await vtscEscrow.createContract(contractId, client.address, value, escrowAmount, pastDeadline, docHash);
      await vtscEscrow.connect(client).fundEscrow(contractId, { value: escrowAmount });
      await vtscEscrow.connect(client).signContract(contractId);

      const initialClientBalance = await hre.ethers.provider.getBalance(client.address);

      await expect(vtscEscrow.connect(client).triggerPenalty(contractId))
        .to.emit(vtscEscrow, "PenaltyApplied")
        .withArgs(contractId, escrowAmount);

      const contractData = await vtscEscrow.getContract(contractId);
      expect(contractData.status).to.equal(6); // Penalized
    });

    it("Should reject penalty before SLA deadline", async function () {
      const futureDeadline = Math.floor(Date.now() / 1000) + 86400;
      await vtscEscrow.createContract(contractId, client.address, value, escrowAmount, futureDeadline, docHash);
      await vtscEscrow.connect(client).fundEscrow(contractId, { value: escrowAmount });
      await vtscEscrow.connect(client).signContract(contractId);

      await expect(
        vtscEscrow.connect(client).triggerPenalty(contractId)
      ).to.be.revertedWith("SLA deadline not yet reached");
    });
  });
});
