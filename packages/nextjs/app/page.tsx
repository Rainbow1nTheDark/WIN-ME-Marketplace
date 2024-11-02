import Image from "next/image";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-[90%] md:w-[75%]">
        <h1 className="text-center mb-6">
          <span className="block text-2xl mb-2">Welcome to</span>
          <span className="block text-4xl font-bold">WIN ME Marketplace</span>
        </h1>
        <div className="flex flex-col items-center justify-center">
          <Image
            src="/image.jpg"  // Make sure to add this image to your public folder
            width="727"
            height="231"
            alt="WIN ME Race Game Banner"
            className="rounded-xl border-4 border-primary"
          />
          <div className="max-w-3xl">
            <p className="text-center text-lg mt-8">
              🏎️ Welcome to WIN ME, the ultimate NFT marketplace for racing enthusiasts! Collect, trade, and race
              with unique digital assets representing high-performance vehicles and tracks.
            </p>
            <p className="text-center text-lg mt-4">
              🏁 Our marketplace features three exciting NFT collections:
            </p>
            <ul className="list-disc list-inside text-lg mt-2">
              <li>🚗 Sport Cars: Sleek and agile vehicles for street racing</li>
              <li>🏎️ Race Cars: High-performance machines built for the track</li>
              <li>🛣️ Track Cars: Versatile vehicles that excel on any surface</li>
            </ul>
            <p className="text-center text-lg mt-4">
              💼 Buy, sell, and trade these NFTs to build your ultimate racing team. Each NFT comes with unique
              attributes that affect its performance in our upcoming racing game.
            </p>
            <p className="text-center text-lg mt-4">
              🌟 Get ready to experience the thrill of NFT racing! Start your collection today and prepare for
              high-stakes competitions where your NFTs' attributes will determine your success on the track.
            </p>
            <div className="text-center mt-8">
              <a
                href="/marketplace"
                className="bg-primary text-white font-bold py-2 px-4 rounded hover:bg-primary-dark transition duration-300"
              >
                Enter the Marketplace
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
