import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { WinMeCollectible } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import * as dotenv from "dotenv";

dotenv.config();

describe("WinMeCollectible", function () {
  let winMeCollectible: WinMeCollectible;
  let owner: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  let signer: HardhatEthersSigner;

  // Helper function to generate signature
  async function generateSignature(userAddress: string, tokenId: number, mintCount: number) {
    const messageHash = ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'uint256'],
      [userAddress, tokenId, mintCount]
    );

    // Create the Ethereum signed message hash
    const ethMessageHash = ethers.hashMessage(ethers.getBytes(messageHash));
    
    // Sign the message using the deployer's private key
    const signerWallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!);
    const signature = await signerWallet.signMessage(ethers.getBytes(messageHash));
    
    return signature;
  }

  beforeEach(async function () {
    if (!process.env.DEPLOYER_PRIVATE_KEY) {
      throw new Error("DEPLOYER_PRIVATE_KEY not found in environment");
    }

    [owner, user] = await ethers.getSigners();
    
    // Create signer from deployer's private key
    const signerWallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY);
    signer = await ethers.getImpersonatedSigner(signerWallet.address);

    // Deploy contract
    const WinMeCollectibleFactory = await ethers.getContractFactory("WinMeCollectible");
    winMeCollectible = await WinMeCollectibleFactory.deploy(signer.address);
    await winMeCollectible.waitForDeployment();
  });

  describe("NFT Claiming", function () {
    it("Should allow claiming NFT with valid signature", async function () {
      const tokenId = 1; // First NFT (Tire 2 Epic)
      
      // Get initial mint count
      const initialMintCount = await winMeCollectible.getMintCount(tokenId);
      
      // Generate signature
      const signature = await generateSignature(
        user.address,
        tokenId,
        Number(initialMintCount)
      );

      // Claim NFT
      await winMeCollectible.connect(user).claimNFT(tokenId, signature);

      // Check user's balance
      const balance = await winMeCollectible.balanceOf(user.address, tokenId);
      expect(balance).to.equal(1n);
    });

    it("Should fail with invalid signature", async function () {
      const tokenId = 1;
      // Create an invalid signature of correct length
      const invalidSignature = "0x" + "00".repeat(65);

      await expect(
        winMeCollectible.connect(user).claimNFT(tokenId, invalidSignature)
      ).to.be.revertedWith("ECDSA: invalid signature");
    });

    it("Should fail when trying to reuse signature", async function () {
      const tokenId = 1;
      const initialMintCount = await winMeCollectible.getMintCount(tokenId);
      
      const signature = await generateSignature(
        user.address,
        tokenId,
        Number(initialMintCount)
      );

      // First claim should succeed
      await winMeCollectible.connect(user).claimNFT(tokenId, signature);

      // Second claim with same signature should fail
      await expect(
        winMeCollectible.connect(user).claimNFT(tokenId, signature)
      ).to.be.revertedWith("Signature already used");
    });

    it("Should update mint count and remaining supply after claim", async function () {
      const tokenId = 1;
      const initialMintCount = await winMeCollectible.getMintCount(tokenId);
      const initialNFTInfo = await winMeCollectible.getNFTInfo(tokenId);
      
      const signature = await generateSignature(
        user.address,
        tokenId,
        Number(initialMintCount)
      );

      await winMeCollectible.connect(user).claimNFT(tokenId, signature);

      const newMintCount = await winMeCollectible.getMintCount(tokenId);
      const newNFTInfo = await winMeCollectible.getNFTInfo(tokenId);

      expect(newMintCount).to.equal(initialMintCount + 1n);
      expect(newNFTInfo[2]).to.equal(initialNFTInfo[2] - 1n); // remainingSupply
    });

    it("Should emit NFTClaimed event", async function () {
      const tokenId = 1;
      const initialMintCount = await winMeCollectible.getMintCount(tokenId);
      
      const signature = await generateSignature(
        user.address,
        tokenId,
        Number(initialMintCount)
      );

      await expect(winMeCollectible.connect(user).claimNFT(tokenId, signature))
        .to.emit(winMeCollectible, "NFTClaimed")
        .withArgs(user.address, tokenId, 1); // First mint should have mintCount of 1
    });

    it("Should fail when trying to claim non-existent NFT", async function () {
      const nonExistentTokenId = 99;
      const signature = await generateSignature(user.address, nonExistentTokenId, 0);

      await expect(
        winMeCollectible.connect(user).claimNFT(nonExistentTokenId, signature)
      ).to.be.revertedWith("NFT does not exist");
    });
  });
});