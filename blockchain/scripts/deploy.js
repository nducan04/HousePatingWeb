const hre = require("hardhat");

async function main() {
  console.log("Deploying VTSCEscrow...");
  
  const VTSCEscrow = await hre.ethers.getContractFactory("VTSCEscrow");
  const escrow = await VTSCEscrow.deploy();

  await escrow.waitForDeployment();
  const address = await escrow.getAddress();

  console.log(`VTSCEscrow deployed to: ${address}`);
  console.log("Update the CONTRACT_ADDRESS in your backend .env file with this address.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
