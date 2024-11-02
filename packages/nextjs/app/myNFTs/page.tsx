"use client";

import { useState, useEffect, useCallback } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

interface NFT {
  contractName: string;
  balance: number;
  imageUrl: string;
  mintFunction: (args: any) => Promise<any>;
  maxSupply: number;
}

const MyNFTs: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const [userNFTs, setUserNFTs] = useState<NFT[]>([]);

  const { writeAsync: mintSportCar } = useScaffoldContractWrite({
    contractName: "SportCarCollectible",
    functionName: "mint",
    args: [connectedAddress, 1, "0x"]
  });

  const { writeAsync: mintRaceCar } = useScaffoldContractWrite({
    contractName: "RaceCarCollectible",
    functionName: "mint",
    args: [connectedAddress, 1, "0x"]
  });

  const { writeAsync: mintTrackCar } = useScaffoldContractWrite({
    contractName: "TrackCarCollectible",
    functionName: "mint",
    args: [connectedAddress, 1, "0x"]
  });

  const { writeAsync: approveNFTMarketplace } = useScaffoldContractWrite({
    contractName: "SportCarCollectible", // This will need to be dynamic based on the NFT being sold
    functionName: "setApprovalForAll",
  });


  const { data: sportCarBalance, refetch: refetchSportCar } = useScaffoldContractRead({
    contractName: "SportCarCollectible",
    functionName: "balanceOf",
    args: [connectedAddress, 1],
  });

  const { data: raceCarBalance, refetch: refetchRaceCar } = useScaffoldContractRead({
    contractName: "RaceCarCollectible",
    functionName: "balanceOf",
    args: [connectedAddress, 1],
  });

  const { data: trackCarBalance, refetch: refetchTrackCar } = useScaffoldContractRead({
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

  const { data: sportCarMaxSupply } = useScaffoldContractRead({
    contractName: "SportCarCollectible",
    functionName: "MAX_SUPPLY",
  });

  const { data: raceCarMaxSupply } = useScaffoldContractRead({
    contractName: "RaceCarCollectible",
    functionName: "MAX_SUPPLY",
  });

  const { data: trackCarMaxSupply } = useScaffoldContractRead({
    contractName: "TrackCarCollectible",
    functionName: "MAX_SUPPLY",
  });

  const updateNFTBalances = useCallback(() => {
    if (isConnected) {
      refetchSportCar();
      refetchRaceCar();
      refetchTrackCar();
    }
  }, [isConnected, refetchSportCar, refetchRaceCar, refetchTrackCar]);

  useEffect(() => {
    if (isConnected && 
        sportCarBalance !== undefined && raceCarBalance !== undefined && trackCarBalance !== undefined &&
        sportCarUri && raceCarUri && trackCarUri &&
        sportCarMaxSupply && raceCarMaxSupply && trackCarMaxSupply) {
      setUserNFTs([
        { 
          contractName: "SportCarCollectible", 
          balance: Number(sportCarBalance), 
          imageUrl: sportCarUri, 
          mintFunction: mintSportCar,
          maxSupply: Number(sportCarMaxSupply)
        },
        { 
          contractName: "RaceCarCollectible", 
          balance: Number(raceCarBalance), 
          imageUrl: raceCarUri, 
          mintFunction: mintRaceCar,
          maxSupply: Number(raceCarMaxSupply)
        },
        { 
          contractName: "TrackCarCollectible", 
          balance: Number(trackCarBalance), 
          imageUrl: trackCarUri, 
          mintFunction: mintTrackCar,
          maxSupply: Number(trackCarMaxSupply)
        },
      ]);
    } else {
      setUserNFTs([]);
    }
  }, [isConnected, sportCarBalance, raceCarBalance, trackCarBalance, sportCarUri, raceCarUri, trackCarUri, 
      mintSportCar, mintRaceCar, mintTrackCar, sportCarMaxSupply, raceCarMaxSupply, trackCarMaxSupply]);

  const handleMintItem = async (mintFunction: (args: any) => Promise<any>, amount: number = 1) => {
    try {
      await mintFunction({
        args: [connectedAddress, amount, "0x"],
      });
      setTimeout(updateNFTBalances, 2000); // Wait for 2 seconds before updating
    } catch (error) {
      console.error("Minting error:", error);
    }
  };

  return (
    <>
      <div className="flex items-center flex-col pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">WIN ME Store</span>
          </h1>
        </div>
      </div>
      <div className="mt-8 text-center">
        {!isConnected || isConnecting ? (
          <RainbowKitCustomConnectButton />
        ) : (
          <>
            <div className="mb-4">
              <h2 className="text-2xl font-bold">NFT Supply - {userNFTs[0]?.maxSupply}</h2>
              
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {userNFTs.map((nft, index) => (
                <div key={index} className="border p-4 rounded-lg">
                  <img 
                    src={nft.imageUrl} 
                    alt={nft.contractName} 
                    className="mx-auto mb-2 w-48 h-48 object-cover"
                  />
                  <p className="font-bold">{nft.contractName}</p>
                  <p>Your Balance: {nft.balance}</p>
                  <button className="btn btn-secondary mt-2" onClick={() => handleMintItem(nft.mintFunction, 1)}>
                    Mint {nft.contractName.replace('Collectible', '')}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default MyNFTs;
