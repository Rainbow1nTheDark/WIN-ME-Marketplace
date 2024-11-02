// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RaceCarCollectible is ERC1155, Ownable {
    uint256 public constant MY_NFT = 1;
    uint256 public constant MAX_SUPPLY = 3000;

    constructor() ERC1155("https://i.ibb.co/W6NrYgK/Race-Car.jpg") Ownable() {
        _mint(msg.sender, MY_NFT, MAX_SUPPLY, "");
    }

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    function mint(address account, uint256 amount, bytes memory data) public {
        require(totalSupply(MY_NFT) + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(account, MY_NFT, amount, data);
    }

    function totalSupply(uint256 id) public view returns (uint256) {
        return balanceOf(address(this), id);
    }
}