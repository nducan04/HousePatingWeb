const { expect } = require("chai");
const hre = require("hardhat");

describe("VTSCEscrow — Hợp đồng Nguyên tắc B2B", function () {
  let vtscEscrow;
  let owner;  // VTSC Admin
  let client; // Khách hàng B2B
  let other;  // Bên thứ ba (unauthorized)

  const contractId = "CTR-2024-001";
  const docHash = "0xabc123def456789012345678901234567890123456789012345678901234abcd";
  const ipfsCid = "QmTestIPFSCid123456789";
  const value = hre.ethers.parseUnits("500000000", 0); // 500M VNĐ (ghi nhận, không chuyển ETH)

  beforeEach(async function () {
    [owner, client, other] = await hre.ethers.getSigners();
    const VTSCEscrowFactory = await hre.ethers.getContractFactory("VTSCEscrow");
    vtscEscrow = await VTSCEscrowFactory.deploy();
  });

  // ═══════════════════════════════════════════════════════
  // 1. TẠO HỢP ĐỒNG
  // ═══════════════════════════════════════════════════════
  describe("1. Tạo Hợp đồng (createContract)", function () {
    it("Tạo hợp đồng thành công với đầy đủ thông tin", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 86400;

      await expect(vtscEscrow.createContract(contractId, client.address, value, deadline, docHash))
        .to.emit(vtscEscrow, "ContractCreated")
        .withArgs(contractId, owner.address, client.address, value);

      const data = await vtscEscrow.getContract(contractId);
      expect(data.id).to.equal(contractId);
      expect(data.vtsc).to.equal(owner.address);
      expect(data.client).to.equal(client.address);
      expect(data.value).to.equal(value);
      expect(data.documentHash).to.equal(docHash);
      expect(data.status).to.equal(0); // Created
      expect(data.signedBy).to.equal(hre.ethers.ZeroAddress);
      expect(data.signedAt).to.equal(0);
    });

    it("Từ chối tạo hợp đồng trùng mã", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      await vtscEscrow.createContract(contractId, client.address, value, deadline, docHash);

      await expect(
        vtscEscrow.createContract(contractId, client.address, value, deadline, docHash)
      ).to.be.revertedWith("Contract already exists");
    });

    it("Từ chối địa chỉ client = address(0)", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      await expect(
        vtscEscrow.createContract(contractId, hre.ethers.ZeroAddress, value, deadline, docHash)
      ).to.be.revertedWith("Invalid client address");
    });
  });

  // ═══════════════════════════════════════════════════════
  // 2. KÝ SỐ HỢP ĐỒNG (signDocument — 0 ETH, gas-only)
  // ═══════════════════════════════════════════════════════
  describe("2. Ký số Hợp đồng (signDocument)", function () {
    let deadline;

    beforeEach(async function () {
      deadline = Math.floor(Date.now() / 1000) + 86400;
      await vtscEscrow.createContract(contractId, client.address, value, deadline, docHash);
    });

    it("Client ký thành công — ghi documentHash + ipfsCid on-chain", async function () {
      await expect(vtscEscrow.connect(client).signDocument(contractId, docHash, ipfsCid))
        .to.emit(vtscEscrow, "DocumentSigned")
        .withArgs(contractId, client.address, docHash, ipfsCid);

      const data = await vtscEscrow.getContract(contractId);
      expect(data.status).to.equal(1); // Signed
      expect(data.documentHash).to.equal(docHash);
      expect(data.ipfsCid).to.equal(ipfsCid);
      expect(data.signedBy).to.equal(client.address);
      expect(data.signedAt).to.be.gt(0);
    });

    it("VTSC Admin ký thành công (cũng là party)", async function () {
      await expect(vtscEscrow.connect(owner).signDocument(contractId, docHash, ipfsCid))
        .to.emit(vtscEscrow, "DocumentSigned");

      const data = await vtscEscrow.getContract(contractId);
      expect(data.status).to.equal(1); // Signed
      expect(data.signedBy).to.equal(owner.address);
    });

    it("Bên thứ ba KHÔNG được phép ký", async function () {
      await expect(
        vtscEscrow.connect(other).signDocument(contractId, docHash, ipfsCid)
      ).to.be.revertedWith("Only contract parties can perform this action");
    });

    it("Từ chối ký khi status != Created", async function () {
      await vtscEscrow.connect(client).signDocument(contractId, docHash, ipfsCid);

      // Thử ký lần 2 → revert
      await expect(
        vtscEscrow.connect(client).signDocument(contractId, docHash, ipfsCid)
      ).to.be.revertedWith("Contract must be in Created state");
    });
  });

  // ═══════════════════════════════════════════════════════
  // 3. CẬP NHẬT TRẠNG THÁI GIAO HÀNG
  // ═══════════════════════════════════════════════════════
  describe("3. Cập nhật trạng thái (Delivery & Completion)", function () {
    beforeEach(async function () {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      await vtscEscrow.createContract(contractId, client.address, value, deadline, docHash);
      await vtscEscrow.connect(client).signDocument(contractId, docHash, ipfsCid);
    });

    it("VTSC cập nhật trạng thái Delivering", async function () {
      await expect(vtscEscrow.updateDeliveryStatus(contractId))
        .to.emit(vtscEscrow, "StatusUpdated");

      const data = await vtscEscrow.getContract(contractId);
      expect(data.status).to.equal(2); // Delivering
    });

    it("Client KHÔNG được cập nhật delivery", async function () {
      await expect(
        vtscEscrow.connect(client).updateDeliveryStatus(contractId)
      ).to.be.revertedWith("Only VTSC can perform this action");
    });

    it("Xác nhận hoàn tất giao hàng → Completed", async function () {
      await vtscEscrow.updateDeliveryStatus(contractId);

      await expect(vtscEscrow.connect(client).confirmCompletion(contractId))
        .to.emit(vtscEscrow, "StatusUpdated");

      const data = await vtscEscrow.getContract(contractId);
      expect(data.status).to.equal(3); // Completed
    });
  });

  // ═══════════════════════════════════════════════════════
  // 4. TRANH CHẤP (raiseDispute — khi vi phạm SLA)
  // ═══════════════════════════════════════════════════════
  describe("4. Tranh chấp SLA (raiseDispute)", function () {
    it("Phát hiện vi phạm khi quá hạn SLA deadline", async function () {
      const pastDeadline = Math.floor(Date.now() / 1000) - 100; // Quá hạn
      await vtscEscrow.createContract(contractId, client.address, value, pastDeadline, docHash);
      await vtscEscrow.connect(client).signDocument(contractId, docHash, ipfsCid);

      await expect(vtscEscrow.connect(client).raiseDispute(contractId))
        .to.emit(vtscEscrow, "StatusUpdated");

      const data = await vtscEscrow.getContract(contractId);
      expect(data.status).to.equal(4); // Disputed
    });

    it("Từ chối tranh chấp khi SLA chưa hết hạn", async function () {
      const futureDeadline = Math.floor(Date.now() / 1000) + 86400;
      await vtscEscrow.createContract(contractId, client.address, value, futureDeadline, docHash);
      await vtscEscrow.connect(client).signDocument(contractId, docHash, ipfsCid);

      await expect(
        vtscEscrow.connect(client).raiseDispute(contractId)
      ).to.be.revertedWith("SLA deadline not yet reached");
    });
  });

  // ═══════════════════════════════════════════════════════
  // 5. HỦY HỢP ĐỒNG
  // ═══════════════════════════════════════════════════════
  describe("5. Hủy hợp đồng (cancelContract)", function () {
    it("VTSC hủy hợp đồng ở trạng thái Created", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      await vtscEscrow.createContract(contractId, client.address, value, deadline, docHash);

      await expect(vtscEscrow.cancelContract(contractId))
        .to.emit(vtscEscrow, "StatusUpdated");

      const data = await vtscEscrow.getContract(contractId);
      expect(data.status).to.equal(5); // Cancelled
    });

    it("Từ chối hủy khi hợp đồng đã ký", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      await vtscEscrow.createContract(contractId, client.address, value, deadline, docHash);
      await vtscEscrow.connect(client).signDocument(contractId, docHash, ipfsCid);

      await expect(
        vtscEscrow.cancelContract(contractId)
      ).to.be.revertedWith("Can only cancel Created contracts");
    });

    it("Client KHÔNG được phép hủy (chỉ VTSC)", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      await vtscEscrow.createContract(contractId, client.address, value, deadline, docHash);

      await expect(
        vtscEscrow.connect(client).cancelContract(contractId)
      ).to.be.revertedWith("Only VTSC can perform this action");
    });
  });
});
