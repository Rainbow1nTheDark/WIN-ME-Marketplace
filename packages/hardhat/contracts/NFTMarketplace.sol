// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarketplace is ERC1155Holder, ReentrancyGuard {
    struct Order {
        address user;
        uint256 price;
        uint256 amount;
        bool isBuyOrder;
    }

    mapping(address => mapping(uint256 => Order[])) public orders;

    event OrderPlaced(address indexed nftContract, uint256 indexed tokenId, address indexed user, uint256 price, uint256 amount, bool isBuyOrder);
    event OrderFulfilled(address indexed nftContract, uint256 indexed tokenId, address indexed seller, address buyer, uint256 price, uint256 amount);
    event OrderCancelled(address indexed nftContract, uint256 indexed tokenId, address indexed user, bool isBuyOrder);

    function placeOrder(address nftContract, uint256 tokenId, uint256 price, uint256 amount, bool isBuyOrder) external payable {
        require(price > 0, "Price must be greater than zero");
        require(amount > 0, "Amount must be greater than zero");

        if (isBuyOrder) {
            require(msg.value == price * amount, "Incorrect ETH amount for buy order");
        } else {
            // For sell orders, transfer NFTs to the contract
            require(IERC1155(nftContract).balanceOf(msg.sender, tokenId) >= amount, "Insufficient NFT balance");
            IERC1155(nftContract).safeTransferFrom(msg.sender, address(this), tokenId, amount, "");
        }

        orders[nftContract][tokenId].push(Order({
            user: msg.sender,
            price: price,
            amount: amount,
            isBuyOrder: isBuyOrder
        }));

        emit OrderPlaced(nftContract, tokenId, msg.sender, price, amount, isBuyOrder);
    }

    function fulfillOrder(address nftContract, uint256 tokenId, uint256 orderIndex) external payable nonReentrant {
        require(orderIndex < orders[nftContract][tokenId].length, "Invalid order index");
        Order memory order = orders[nftContract][tokenId][orderIndex];
        
        if (order.isBuyOrder) {
            // This is a buy order, so the caller is selling their NFT
            require(IERC1155(nftContract).balanceOf(msg.sender, tokenId) >= order.amount, "Insufficient NFT balance");
            IERC1155(nftContract).safeTransferFrom(msg.sender, order.user, tokenId, order.amount, "");
            payable(msg.sender).transfer(order.price * order.amount);
        } else {
            // This is a sell order, so the caller is buying the NFT
            require(msg.value >= order.price * order.amount, "Insufficient payment");
            IERC1155(nftContract).safeTransferFrom(address(this), msg.sender, tokenId, order.amount, "");
            payable(order.user).transfer(order.price * order.amount);
        }
        
        emit OrderFulfilled(nftContract, tokenId, order.isBuyOrder ? msg.sender : order.user, order.isBuyOrder ? order.user : msg.sender, order.price, order.amount);
        
        // Remove the fulfilled order
        orders[nftContract][tokenId][orderIndex] = orders[nftContract][tokenId][orders[nftContract][tokenId].length - 1];
        orders[nftContract][tokenId].pop();
    }

    function cancelOrder(address nftContract, uint256 tokenId, uint256 orderIndex) external {
        require(orderIndex < orders[nftContract][tokenId].length, "Invalid order index");
        Order memory order = orders[nftContract][tokenId][orderIndex];
        require(order.user == msg.sender, "Not the order creator");
        
        if (order.isBuyOrder) {
            payable(msg.sender).transfer(order.price * order.amount);
        } else {
            IERC1155(nftContract).safeTransferFrom(address(this), msg.sender, tokenId, order.amount, "");
        }
        
        emit OrderCancelled(nftContract, tokenId, msg.sender, order.isBuyOrder);
        
        // Remove the cancelled order
        orders[nftContract][tokenId][orderIndex] = orders[nftContract][tokenId][orders[nftContract][tokenId].length - 1];
        orders[nftContract][tokenId].pop();
    }

    function getOrders(address nftContract, uint256 tokenId) external view returns (Order[] memory) {
        return orders[nftContract][tokenId];
    }

    function getLowestSellPrice(address nftContract, uint256 tokenId) external view returns (uint256) {
        uint256 lowestPrice = type(uint256).max;
        for (uint i = 0; i < orders[nftContract][tokenId].length; i++) {
            if (!orders[nftContract][tokenId][i].isBuyOrder && orders[nftContract][tokenId][i].price < lowestPrice) {
                lowestPrice = orders[nftContract][tokenId][i].price;
            }
        }
        return lowestPrice == type(uint256).max ? 0 : lowestPrice;
    }

    function getHighestBuyPrice(address nftContract, uint256 tokenId) external view returns (uint256) {
        uint256 highestPrice = 0;
        for (uint i = 0; i < orders[nftContract][tokenId].length; i++) {
            if (orders[nftContract][tokenId][i].isBuyOrder && orders[nftContract][tokenId][i].price > highestPrice) {
                highestPrice = orders[nftContract][tokenId][i].price;
            }
        }
        return highestPrice;
    }
}
