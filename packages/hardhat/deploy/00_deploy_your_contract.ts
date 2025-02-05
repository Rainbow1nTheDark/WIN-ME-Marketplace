import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy WinMeCollectible with deployer as signer
  const winMeCollectible = await deploy("WinMeCollectible", {
    from: deployer,
    args: [deployer], // Pass deployer address as the signer address
    log: true,
    autoMine: true,
  });

  console.log("WinMeCollectible (CarPartsCollection) deployed to:", winMeCollectible.address);
};

export default deployYourContract;

deployYourContract.tags = ["WinMeCollectible"];