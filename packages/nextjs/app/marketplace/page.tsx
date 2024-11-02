"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldContractRead, useScaffoldContractWrite, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { ethers } from "ethers";

interface NFT {
  contractName: string;
  contractAddress: string;
  balance: number;
  imageUrl: string;
  tokenId: number;
}

interface Order {
  user: string;
  price: string;
  amount: number;
  isBuyOrder: boolean;
}

const Marketplace: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [customPrice, setCustomPrice] = useState("");
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<number | null>(null);

  // Get contract instances
  const { data: sportCarContract } = useScaffoldContract({ contractName: "SportCarCollectible" });
  const { data: raceCarContract } = useScaffoldContract({ contractName: "RaceCarCollectible" });
  const { data: trackCarContract } = useScaffoldContract({ contractName: "TrackCarCollectible" });
  const { data: nftMarketplaceContract } = useScaffoldContract({ contractName: "NFTMarketplace" });

  // Contract reads
  const { data: sportCarBalance } = useScaffoldContractRead({
    contractName: "SportCarCollectible",
    functionName: "balanceOf",
    args: [connectedAddress, 1],
  });

  const { data: raceCarBalance } = useScaffoldContractRead({
    contractName: "RaceCarCollectible",
    functionName: "balanceOf",
    args: [connectedAddress, 1],
  });

  const { data: trackCarBalance } = useScaffoldContractRead({
    contractName: "TrackCarCollectible",
    functionName: "balanceOf",
    args: [connectedAddress, 1],
  });

  const { data: sportCarUri } = useScaffoldContractRead({
    contractName: "SportCarCollectible",
    functionName: "uri",
    args: [1],
  });

  const { data: raceCarUri } = useScaffoldContractRead({
    contractName: "RaceCarCollectible",
    functionName: "uri",
    args: [1],
  });

  const { data: trackCarUri } = useScaffoldContractRead({
    contractName: "TrackCarCollectible",
    functionName: "uri",
    args: [1],
  });

  const { data: orders, refetch: refetchOrders } = useScaffoldContractRead({
    contractName: "NFTMarketplace",
    functionName: "getOrders",
    args: [selectedNFT?.contractAddress, selectedNFT?.tokenId],
  });

  const { data: marketplaceNFTBalance } = useScaffoldContractRead({
    contractName: selectedNFT?.contractName,
    functionName: "balanceOf",
    args: [nftMarketplaceContract?.address, selectedNFT?.tokenId],
  });

  // Contract writes
  const { writeAsync: placeOrder } = useScaffoldContractWrite({
    contractName: "NFTMarketplace",
    functionName: "placeOrder",
  });

  const { writeAsync: fulfillOrder } = useScaffoldContractWrite({
    contractName: "NFTMarketplace",
    functionName: "fulfillOrder",
  });

  const { writeAsync: approveSportCar } = useScaffoldContractWrite({
    contractName: "SportCarCollectible",
    functionName: "setApprovalForAll",
  });

  const { writeAsync: approveRaceCar } = useScaffoldContractWrite({
    contractName: "RaceCarCollectible",
    functionName: "setApprovalForAll",
  });

  const { writeAsync: approveTrackCar } = useScaffoldContractWrite({
    contractName: "TrackCarCollectible",
    functionName: "setApprovalForAll",
  });

  useEffect(() => {
    if (isConnected && 
        sportCarBalance !== undefined && raceCarBalance !== undefined && trackCarBalance !== undefined &&
        sportCarUri && raceCarUri && trackCarUri &&
        sportCarContract && raceCarContract && trackCarContract) {
      setNfts([
        {
          contractName: "SportCarCollectible",
          contractAddress: sportCarContract.address,
          balance: Number(sportCarBalance),
          imageUrl: sportCarUri,
          tokenId: 1,
        },
        {
          contractName: "RaceCarCollectible",
          contractAddress: raceCarContract.address,
          balance: Number(raceCarBalance),
          imageUrl: raceCarUri,
          tokenId: 1,
        },
        {
          contractName: "TrackCarCollectible",
          contractAddress: trackCarContract.address,
          balance: Number(trackCarBalance),
          imageUrl: trackCarUri,
          tokenId: 1,
        },
      ]);
    }
  }, [isConnected, sportCarBalance, raceCarBalance, trackCarBalance, sportCarUri, raceCarUri, trackCarUri, 
      sportCarContract, raceCarContract, trackCarContract]);

  const handleBuy = (nft: NFT) => {
    setSelectedNFT(nft);
    setShowBuyModal(true);
    refetchOrders();
  };

  const handleSell = (nft: NFT) => {
    setSelectedNFT(nft);
    setShowSellModal(true);
  };

  const handlePlaceBuyOrder = async () => {
    if (selectedNFT && customPrice) {
      try {
        await placeOrder({
          args: [selectedNFT.contractAddress, selectedNFT.tokenId, ethers.parseEther(customPrice), 1, true],
          value: ethers.parseEther(customPrice),
        });
        setShowBuyModal(false);
        refetchOrders();
      } catch (error) {
        console.error("Error placing buy order:", error);
      }
    }
  };

  const handlePlaceSellOrder = async () => {
    if (selectedNFT && customPrice && nftMarketplaceContract) {
      try {
        let approveFunction;
        switch (selectedNFT.contractName) {
          case "SportCarCollectible":
            approveFunction = approveSportCar;
            break;
          case "RaceCarCollectible":
            approveFunction = approveRaceCar;
            break;
          case "TrackCarCollectible":
            approveFunction = approveTrackCar;
            break;
          default:
            throw new Error("Unknown NFT type");
        }

        // Approve the NFT Marketplace to handle the NFTs
        await approveFunction({
          args: [nftMarketplaceContract.address, true],
        });

        // Wait for the approval transaction to be mined
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Then place the sell order
        await placeOrder({
          args: [selectedNFT.contractAddress, selectedNFT.tokenId, ethers.parseEther(customPrice), 1, false], // Note the 'false' here
        });
        setShowSellModal(false);
        refetchOrders();
      } catch (error) {
        console.error("Error placing sell order:", error);
      }
    }
  };

  const handleFulfillBuyOrder = async (orderIndex: number) => {
    if (selectedNFT) {
      try {
        setSelectedOrderIndex(orderIndex);
        
        // For buy orders, we need to approve the marketplace to transfer our NFTs
        let approveFunction;
        switch (selectedNFT.contractName) {
          case "SportCarCollectible":
            approveFunction = approveSportCar;
            break;
          case "RaceCarCollectible":
            approveFunction = approveRaceCar;
            break;
          case "TrackCarCollectible":
            approveFunction = approveTrackCar;
            break;
          default:
            throw new Error("Unknown NFT type");
        }

        await approveFunction({
          args: [nftMarketplaceContract?.address, true],
        });

        // Wait for the approval transaction to be mined
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Now fulfill the order
        await fulfillOrder({
          args: [selectedNFT.contractAddress, selectedNFT.tokenId, orderIndex],
        });
        
        refetchOrders();
        alert("Buy order fulfilled successfully!");
      } catch (error) {
        console.error("Error fulfilling buy order:", error);
        alert("An error occurred while fulfilling the buy order.");
      } finally {
        setSelectedOrderIndex(null);
      }
    }
  };

  const handleFulfillSellOrder = async (orderIndex: number) => {
    if (selectedNFT) {
      try {
        setSelectedOrderIndex(orderIndex);
        
        const order = orders[orderIndex];
        
        // For sell orders, we need to send the correct amount of ETH
        await fulfillOrder({
          args: [selectedNFT.contractAddress, selectedNFT.tokenId, orderIndex],
          value: order.price,
        });
        
        refetchOrders();
        alert("Sell order fulfilled successfully!");
      } catch (error) {
        console.error("Error fulfilling sell order:", error);
        alert("An error occurred while fulfilling the sell order.");
      } finally {
        setSelectedOrderIndex(null);
      }
    }
  };

  useEffect(() => {
    if (!showBuyModal) {
      setSelectedOrderIndex(null);
    }
  }, [showBuyModal]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">NFT Marketplace</h1>
      {!isConnected ? (
        <div className="text-center">
          <RainbowKitCustomConnectButton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {nfts.map((nft, index) => (
            <div key={index} className="border p-4 rounded-lg">
              <img src={nft.imageUrl} alt={nft.contractName} className="w-full h-48 object-cover mb-2" />
              <h2 className="text-xl font-semibold">{nft.contractName.replace('Collectible', '')}</h2>
              <p>Your Balance: {nft.balance}</p>
              <div className="mt-4 flex justify-between">
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  onClick={() => handleBuy(nft)}
                >
                  Buy
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded"
                  onClick={() => handleSell(nft)}
                >
                  Sell
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showBuyModal && selectedNFT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Buy {selectedNFT.contractName}</h2>
            <h3 className="text-xl font-semibold mb-2">Sell Orders (You can buy these)</h3>
            {orders?.filter((order: Order) => !order.isBuyOrder).map((order: Order, index: number) => (
              <div key={index} className="mb-2">
                <p>Price: {ethers.formatEther(order.price)} ETH</p>
                <p>Amount: {order.amount}</p>
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                  onClick={() => handleFulfillSellOrder(index)}
                  disabled={selectedOrderIndex === index}
                >
                  {selectedOrderIndex === index ? 'Processing...' : 'Buy'}
                </button>
              </div>
            ))}
            <h3 className="text-xl font-semibold mt-4 mb-2">Place Buy Order</h3>
            <input
              type="number"
              step="0.01"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              className="border p-2 rounded"
              placeholder="Enter price in ETH"
            />
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded ml-2"
              onClick={handlePlaceBuyOrder}
            >
              Place Buy Order
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded ml-2"
              onClick={() => setShowBuyModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showSellModal && selectedNFT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Sell {selectedNFT.contractName}</h2>
            <h3 className="text-xl font-semibold mb-2">Buy Orders (You can sell to these)</h3>
            {orders?.filter((order: Order) => order.isBuyOrder).map((order: Order, index: number) => (
              <div key={index} className="mb-2">
                <p>Price: {ethers.formatEther(order.price)} ETH</p>
                <p>Amount: {order.amount}</p>
                <button
                  className="bg-green-500 text-white px-2 py-1 rounded"
                  onClick={() => handleFulfillBuyOrder(index)}
                  disabled={selectedOrderIndex === index}
                >
                  {selectedOrderIndex === index ? 'Processing...' : 'Sell'}
                </button>
              </div>
            ))}
            <h3 className="text-xl font-semibold mt-4 mb-2">Place Sell Order</h3>
            <input
              type="number"
              step="0.01"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              className="border p-2 rounded"
              placeholder="Enter price in ETH"
            />
            <button
              className="bg-green-500 text-white px-4 py-2 rounded ml-2"
              onClick={handlePlaceSellOrder}
            >
              Place Sell Order
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded ml-2"
              onClick={() => setShowSellModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
