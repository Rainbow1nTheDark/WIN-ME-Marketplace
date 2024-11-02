import * as dotenv from "dotenv";
dotenv.config();
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@nomicfoundation/hardhat-verify";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "flatten";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "london"
    },
  },
  networks: {
    morphTestnet: {
      url: process.env.MORPH_TESTNET_URL || "",
      accounts:
        process.env.DEPLOYER_PRIVATE_KEY !== undefined ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      gasPrice: 2000000000 // 2 gwei in wei
    },
  },
  etherscan: {
    apiKey: {
      morphTestnet: 'anything',
    },
    customChains: [
      {
        network: 'morphTestnet',
        chainId: 2810,
        urls: {
          apiURL: 'https://explorer-api-holesky.morphl2.io/api?',
          browserURL: 'https://explorer-holesky.morphl2.io/',
        },
      },
    ],
  },
  // Add this namedAccounts configuration
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      morphTestnet: 0, // similarly on morphTestnet it will take the first account as deployer
    },
  },
};

export default config;