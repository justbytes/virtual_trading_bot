require("dotenv").config();
const fetch = require("node-fetch");
const { Alchemy } = require("alchemy-sdk");
const { ethers } = require("ethers");
const { agentTokenInfo } = require("./scripts/getAgentInfo");

// Enviorment settings
const {
  BASE_MAINNET,
  FFACTORY_ADDRESS,
  FFACTORY_INTERFACE,
  FPAIR_INTERFACE,
  VIRTUAL_TOKEN_ADDRESS,
} = require("./utils/config");

// Import helper functions
const {
  loadAgents,
  loadPairs,
  updateAgentLists,
  saveData,
} = require("./utils/helpers");

const {
  activateTargetPriceListener,
  activateLaunchedListener,
} = require("./scripts/listeners");

class App {
  constructor() {
    this.unhandledAgents = new Map();
    this.activeTrades = new Map();
    this.pairs = new Map();
    this.prototypes = new Map();
    this.sentients = new Map();
    this.alchemy = new Alchemy(BASE_MAINNET);
    this.saveInterval = null;
  }

  async initialize() {
    this.pairs = await loadPairs();
    const { prototypes, sentients } = await loadAgents();

    this.prototypes = prototypes;
    this.sentients = sentients;

    // Get current list of pairs from ffactory
    const pairsLength = await this.getAllPairsLength();

    if (pairsLength > this.pairs.size) {
      console.log(`${Number(pairsLength) - this.pairs.size} pairs to process`);
      await updateAgentLists(this, this.pairs.size, pairsLength);
    } else {
      console.log("No new pairs to process");
    }

    activateLaunchedListener(this);
    // TODO: Activate a listener for each prototype that checks the market cap after a transfer / swap to find 95%+ tokens
    this.autoSave();
    return this;
  }

  // Every 10 minutes it saves the pairs and prototypes to file
  autoSave() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }

    this.saveInterval = setInterval(() => {
      try {
        saveData(this.pairs, this.prototypes, this.sentients);
        console.log("Saved data to file");
      } catch (error) {
        console.error("Error saving data:", error);
      }
    }, 10 * 60 * 1000); // 10 minutes in milliseconds

    return this.saveInterval;
  }

  sellToken(tokenAddress) {
    console.log("Selling token");
    // TODO: run the mox run sell python script

    // Remove the token from the active trades
    this.activeTrades.delete(tokenAddress);
    console.log("| Selling |Active trades: ", this.activeTrades.size);
  }

  buyToken(tokenAddress, pairAddress, targetPrice, stopLoss) {
    console.log("Buying token");
    // TODO: run the mox run buy python script

    // Set the target price listener
    activateTargetPriceListener(
      this,
      targetPrice,
      pairAddress,
      tokenAddress,
      stopLoss
    );

    // Add to active trades Map
    this.activeTrades.set(tokenAddress, {
      target: targetPrice,
      stopLoss: stopLoss,
    });
    console.log("| Buying |Active trades: ", this.activeTrades.size);
  }

  async handleLaunchedAgent(pairAddress, tokenAddress) {
    let agent;

    // Add pair to the pairs map
    this.addPair(pairAddress);

    // Get agent info from bonding contract
    agent = await agentTokenInfo(tokenAddress);

    if (!agent) {
      console.log("Agent not found");
      this.unhandledAgents.set(pairAddress, tokenAddress);
      return;
    }

    // If the agent is trading on uniswap, add it to the sentients list
    if (agent.tradingOnUniswap) {
      this.addSentient(agent);
    } else {
      this.addPrototype(agent);
    }

    // Get current price of virtual token
    const virtualPrice = await this.getVirtualTokenPrice();
    const normalizedMarketCap =
      (agent.data.marketCap / 10 ** 18) * virtualPrice;
    console.log("Normalized market cap: ", normalizedMarketCap);
    if (normalizedMarketCap < 30000) {
      // Get current price set target price (increase of 20%) and buy
      const currentPrice = agent.data.price;
      const targetPrice = currentPrice * 1.1; // 10% increase
      const stopLoss = currentPrice - currentPrice * 0.6; // 60% decrease

      console.log("Target price: ", targetPrice);
      console.log("Current price: ", currentPrice);
      console.log("Stop loss: ", stopLoss);

      // Buy the token
      this.buyToken(tokenAddress, pairAddress, targetPrice, stopLoss);
    } else {
      console.log("Market cap is too high", normalizedMarketCap);
    }
  }

  // ** SOON TO BE IMPLEMENTED **
  // // Move the prototype to the sentients list
  // handleGraduatedAgent(prototypeAddress) {
  //   const agent = this.prototypes.get(prototypeAddress);
  //   this.prototypes.delete(prototypeAddress);
  //   this.sentients.set(agent.token, agent);

  //   // TODO: Check if we have any of the ferc20 tokens in our wallet and if so call the bonding.unwrap() function
  //   // TODO: Set a listener to sell on uniswap when the token reaches a target price (20% increase)
  // }

  async getVirtualTokenPrice() {
    // Request parameters
    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        addresses: [
          {
            network: "base-mainnet",
            address: VIRTUAL_TOKEN_ADDRESS,
          },
        ],
      }),
    };

    // Alchemy API get price by token address endpoint
    const response = await fetch(
      `https://api.g.alchemy.com/prices/v1/${process.env.ALCHEMY_KEY}/tokens/by-address`,
      options
    );
    const data = await response.json();

    return data.data[0].prices[0].value;
  }

  async getAllPairsLength() {
    try {
      const factory = new ethers.Contract(
        FFACTORY_ADDRESS,
        FFACTORY_INTERFACE,
        await this.alchemy.config.getProvider()
      );
      return await factory.allPairsLength();
    } catch (error) {
      throw new Error("| App.js | Error getting all pairs length\n", error);
    }
  }

  addPair(pair) {
    console.log("New pair added");

    this.pairs.set(pair);
  }

  addPrototype(tokenInfo) {
    console.log("New prototype added");

    this.prototypes.set(tokenInfo.token, tokenInfo);
  }

  addSentient(tokenInfo) {
    console.log("New sentient added");

    this.sentients.set(tokenInfo.token, tokenInfo);
  }
}

module.exports = App;
