// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract WinMeCollectible is ERC1155, Ownable {
    using ECDSA for bytes32;

    // NFT Types
    enum Rarity { COMMON, RARE, EPIC }
    
    struct NFTInfo {
        string uri;
        uint256 maxSupply;
        uint256 remainingSupply;
        uint256 mintCount;  // Track number of mints
        bool exists;
        Rarity rarity;
    }

    // Mapping from token ID to NFT info
    mapping(uint256 => NFTInfo) public nftInfo;
    // Backend signer address for verification
    address private immutable _signerAddress;
    // Mapping to track used signatures
    mapping(bytes => bool) private _usedSignatures;
    // Next token ID to be used
    uint256 private _nextTokenId = 1;

    event NFTAdded(uint256 tokenId, string uri, uint256 maxSupply, Rarity rarity);
    event NFTClaimed(address indexed user, uint256 tokenId, uint256 mintCount);

    constructor(address signerAddress) ERC1155("") Ownable() {
        _signerAddress = signerAddress;
        _addInitialNFTs();
    }

    function _addInitialNFTs() private {
        addNewNFT("ipfs://bafybeibad7vzbprtkxn7puinst6gcbmzdumlniih5de2u6nde343csqxya", Rarity.EPIC);    // Tire 2 Epic
        addNewNFT("ipfs://bafybeiaqz25276p2l3fykh6fgped5vx6466zlrobxd5pki45qdtk2zhhj4", Rarity.RARE);    // Rare Tire 2
        addNewNFT("ipfs://bafkreib45bkcggvetqene5vwxtrznxncb43pzkfiti3s43cklabjna7fei", Rarity.COMMON);  // Hat Common
        addNewNFT("ipfs://bafybeig4i54uzn4ymbiizg6kzatyn54qjgakjdpfyruxyp6o227j4nwc6y", Rarity.RARE);    // Cap Rare
        addNewNFT("ipfs://bafkreid3t74frbfy22v7c3ufzeq2b7p7z3ygycyldmqmmxo3emxenjm2si", Rarity.EPIC);    // Banana Epic
        addNewNFT("ipfs://bafybeihu5lcexgxdnl34q2djrm3traul5g6t4yvrhqbyc5ww4rkzrydfiq", Rarity.COMMON);  // Tire 1
    }

    function addNewNFT(string memory _uri, Rarity _rarity) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        uint256 supply;
        
        if (_rarity == Rarity.COMMON) {
            supply = 500;
        } else if (_rarity == Rarity.RARE) {
            supply = 250;
        } else if (_rarity == Rarity.EPIC) {
            supply = 50;
        }

        nftInfo[tokenId] = NFTInfo({
            uri: _uri,
            maxSupply: supply,
            remainingSupply: supply,
            mintCount: 0,  // Initialize mint count
            exists: true,
            rarity: _rarity
        });

        _mint(address(this), tokenId, supply, "");

        emit NFTAdded(tokenId, _uri, supply, _rarity);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        require(nftInfo[tokenId].exists, "NFT does not exist");
        return nftInfo[tokenId].uri;
    }

    function claimNFT(uint256 tokenId, bytes memory signature) public {
        require(nftInfo[tokenId].exists, "NFT does not exist");
        require(!_usedSignatures[signature], "Signature already used");
        require(nftInfo[tokenId].remainingSupply > 0, "No supply left");

        // Verify the signature using current mint count
        bytes32 messageHash = keccak256(abi.encodePacked(
            msg.sender, 
            tokenId,
            nftInfo[tokenId].mintCount  // Use current mint count
        ));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        require(ethSignedMessageHash.recover(signature) == _signerAddress, "Invalid signature");

        // Mark signature as used
        _usedSignatures[signature] = true;

        // Increment mint count before transfer
        nftInfo[tokenId].mintCount++;
        
        // Transfer NFT and update supply
        _safeTransferFrom(address(this), msg.sender, tokenId, 1, "");
        nftInfo[tokenId].remainingSupply--;

        emit NFTClaimed(msg.sender, tokenId, nftInfo[tokenId].mintCount);
    }

    function getMintCount(uint256 tokenId) public view returns (uint256) {
        require(nftInfo[tokenId].exists, "NFT does not exist");
        return nftInfo[tokenId].mintCount;
    }

    function getNFTInfo(uint256 tokenId) public view returns (
        string memory _uri,
        uint256 _maxSupply,
        uint256 _remainingSupply,
        uint256 _mintCount,
        Rarity _rarity
    ) {
        require(nftInfo[tokenId].exists, "NFT does not exist");
        NFTInfo memory info = nftInfo[tokenId];
        return (
            info.uri,
            info.maxSupply,
            info.remainingSupply,
            info.mintCount,
            info.rarity
        );
    }

    function getNextTokenId() public view returns (uint256) {
        return _nextTokenId;
    }

    // Override required by Solidity
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}