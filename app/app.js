const { Alchemy } = require("alchemy-sdk");
const { ethers } = require("ethers");
const { getAgentInfoFromPair } = require("./scripts/getAgentInfo");

// Enviorment settings
const {
  BASE_MAINNET,
  FFACTORY_ADDRESS,
  FFACTORY_INTERFACE,
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
} = require("./listeners");

class App {
  constructor() {
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
    // TODO: Activate a listener for each prototype that checks the market cap after a transfer / swap
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
    console.log("|Selling|Active trades: ", this.activeTrades.size);
  }

  buyToken(tokenAddress, targetPrice) {
    console.log("Buying token");
    // TODO: run the mox run buy python script

    // Set the target price listener
    activateTargetPriceListener(this, targetPrice, tokenAddress);
    // Add the token to the active trades
    this.activeTrades.set(tokenAddress, targetPrice);
    console.log("|Buying|Active trades: ", this.activeTrades.size);
  }

  async handleLaunchedAgent(pair) {
    console.log("Adding new agent to list");
    this.addPair(pair);
    const agent = await getAgentInfoFromPair(pair);

    if (agent.tradingOnUniswap) {
      this.addSentient(agent);
      return;
    } else {
      this.addPrototype(agent);
    }

    // Get current price set target price (increase of 20%) and buy
    const currentPrice = agent.data.price;
    const targetPrice = currentPrice * 1.2; // 20% increase

    console.log("Target price: ", targetPrice);
    // Buy the token
    this.buyToken(agent.token, targetPrice);
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

  async getAllPairsLength() {
    const factory = new ethers.Contract(
      FFACTORY_ADDRESS,
      FFACTORY_INTERFACE,
      await this.alchemy.config.getProvider()
    );
    return await factory.allPairsLength();
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
