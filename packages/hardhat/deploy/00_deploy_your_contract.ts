import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy NFTMarketplace
  const marketplace = await deploy("NFTMarketplace", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("NFTMarketplace deployed to:", marketplace.address);

  //  Uncomment and modify these if you want to deploy other contracts
  const sportCarCollectible = await deploy("SportCarCollectible", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const raceCarCollectible = await deploy("RaceCarCollectible", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const trackCarCollectible = await deploy("TrackCarCollectible", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("SportCarCollectible deployed to:", sportCarCollectible.address);
  console.log("RaceCarCollectible deployed to:", raceCarCollectible.address);
  console.log("TrackCarCollectible deployed to:", trackCarCollectible.address);
};

export default deployYourContract;

deployYourContract.tags = ["NFTMarketplace", "SportCarCollectible", "RaceCarCollectible", "TrackCarCollectible"];