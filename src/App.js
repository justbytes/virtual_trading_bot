require('dotenv').config();
const fetch = require('node-fetch');
const { ethers } = require('ethers');
const { agentTokenInfo } = require('./scripts/getAgentInfo');

// Enviorment settings
const {
  BASE_MAINNET,
  FFACTORY_ADDRESS,
  FFACTORY_INTERFACE,
  VIRTUAL_TOKEN_ADDRESS,
  WALLET_ADDRESS,
} = require('./utils/config');

// Import helper functions
const {
  loadAgents,
  loadPairs,
  updateAgentLists,
  saveData,
  initializeDataStructure,
} = require('./utils/helpers');
const { activateTargetPriceListener, activateLaunchedListener } = require('./scripts/listeners');

/**
 * Main App that starts the listeners and keeps tabs on all of the prototypes and sentient tokens from the virtuals protocol.
 * Takes a the VirtualTrader class as a parameter which has access to the VirtualTrader contract.
 */
class App {
  /**
   * Constructor setting initial variables
   */
  constructor(virtualTrader, alchemy) {
    this.virtualTrader = virtualTrader;
    this.unhandledAgents = new Map();
    this.activeTrades = new Map();
    this.pairs = new Map();
    this.prototypes = new Map();
    this.sentients = new Map();
    this.alchemy = alchemy;
    this.saveInterval = null;
  }

  /**
   * Loads the protocol tokens from file
   */
  async initialize(freshData) {
    // Only get fresh data if the user wants it
    if (freshData) {
      try {
        // First, ensure all required directories and files exist
        await initializeDataStructure();
        console.log('Data structure initialized');

        // Get a list of pairs from file
        this.pairs = await loadPairs();

        // Get the prototypes and sentient tokens from file
        const { prototypes, sentients } = await loadAgents();

        this.prototypes = prototypes;
        this.sentients = sentients;

        console.log(
          `Loaded: ${this.pairs.size} pairs, ${this.prototypes.size} prototypes, ${this.sentients.size} sentients`
        );

        // Get current list of pairs from ffactory
        console.log('Checking for new pairs on the blockchain...');
        const pairsLength = await this.getAllPairsLength();
        console.log(`Blockchain has ${pairsLength} total pairs`);

        // See if we can update the list with new pairs
        if (pairsLength > this.pairs.size) {
          console.log(`${Number(pairsLength) - this.pairs.size} new pairs to process`);

          // Update the list
          await updateAgentLists(this, this.pairs.size, pairsLength);

          // Save the updated data immediately after processing new pairs
          await saveData(this.pairs, this.prototypes, this.sentients);
          console.log('Updated data saved to files');
        } else {
          console.log('No new pairs to process');
        }

        // Activate the new prototype token event listener
        activateLaunchedListener(this);
        console.log('Event listeners activated');

        // TODO: Activate a listener for each prototype that checks the market cap after a transfer / swap to find 95%+ token

        // start the auto save interval
        this.autoSave();
        console.log('Auto-save interval started');

        console.log('App initialization complete!');
        return this;
      } catch (error) {
        console.error('Error during App initialization:', error);
      }
    }

    // Still try to start the listeners and auto-save
    activateLaunchedListener(this);
    this.autoSave();
    return this;
  }

  /**
   * Every 10 minutes it saves the pairs and prototypes to file
   */
  autoSave() {
    // Reset the inteval
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }

    // Save to keep logs of all the tokens created for quicker indexing if needed in the future
    this.saveInterval = setInterval(() => {
      try {
        saveData(this.pairs, this.prototypes, this.sentients);
        console.log('Saved data to file');
      } catch (error) {
        console.error('Error saving data:', error);
      }
    }, 10 * 60 * 1000); // 10 minutes in milliseconds

    return this.saveInterval;
  }

  /**
   * Sells a token using the the VirtualTrader contract which is selling the tokens of the virtuals bonding curve protocol
   */
  async sellToken(tokenAddress) {
    try {
      // Get the amount of the target token to sell
      const amount = await alchemy.core.getTokenBalances(WALLET_ADDRESS, [tokenAddress]);
      // const amount = await this.virtualTrader.getBalance(tokenAddress);

      // Stop if there was no amount
      if (!amount) {
        console.log('No balance found for token');
        return false;
      }

      console.log('Amount to sell: ', amount.toString());

      // Sell using the VirtualTrader contract
      const success = await this.virtualTrader.sell(tokenAddress, amount);

      if (success) {
        console.log('Token was successfully sold');

        // Remove the token from the active trades
        this.activeTrades.delete(tokenAddress);

        console.log('Active trades: ', this.activeTrades.size);
        return true;
      } else {
        console.log('Failed to sell token');
        return false;
      }
    } catch (error) {
      console.error('Error in sellToken:', error.message);
      return false;
    }
  }

  /**
   * Buys a token using the the VirtualTrader contract which is buying the tokens of the virtuals bonding curve protocol
   */
  async buyToken(tokenAddress, pairAddress, targetPrice, stopLoss) {
    try {
      // Get 1/4 of the total virtual tokens to trade with
      const amount = await this.getAmountToTrade();
      console.log('Amount to trade: ', amount);

      // If the amount is false its because we have too many active trades or we have no money
      if (!amount) {
        console.log('Could not determine amount to trade');
        return false;
      }

      // Make the trade
      const success = await this.virtualTrader.buy(tokenAddress, amount);
      console.log('BUY was a success');

      // Stop if the trade was unsuccessful
      if (!success) {
        console.log('Failed to buy token');
        return false;
      }

      // Before setting a price target listener check the price to see if we hit already
      const tokenInfo = await agentTokenInfo(tokenAddress);

      // Close the position if something happened to reduce chances of loss
      if (!tokenInfo) {
        console.log(
          'There was an error getting the token info on the target price listener.\nClosing current position'
        );
        await this.sellToken(tokenAddress);
        return false;
      }

      // If the price hit then sell
      if (tokenInfo.data.price >= targetPrice) {
        console.log('Target price hit!');
        await this.sellToken(tokenAddress);
        return true;
      }

      // Set the target price listener
      activateTargetPriceListener(this, targetPrice, pairAddress, tokenAddress, stopLoss);

      // Add to active trades Map
      this.activeTrades.set(tokenAddress, {
        target: targetPrice,
        stopLoss: stopLoss,
      });

      console.log('Active trades: ', this.activeTrades.size);
      return true;
    } catch (error) {
      console.error('Error in buyToken:', error.message);
      return false;
    }
  }

  /**
   * Gets the balance of virtual tokens in the trading wallet.
   * Only allow 4 active trades allocating 1/4 of the total tokens to each trade
   */
  async getAmountToTrade() {
    // Virtual Trader Contract only a maximum of 50 virtual tokens and sends the extra to the owner wallet.

    // Stop if we have to many trades going already
    if (this.activeTrades.size >= 4) {
      console.log('Maximum number of active trades reached');
      return false;
    }

    // Get the balance from our trading wallet
    const balance = await alchemy.core.getTokenBalances(WALLET_ADDRESS, [VIRTUAL_TOKEN_ADDRESS]);
    console.log('BUYING: VIRT BALANCE ', balance);

    //const balance = await this.virtualTrader.getBalance(VIRTUAL_TOKEN_ADDRESS);

    // Convert from wei to regular units (assuming 18 decimals)
    const normalizedBalance = Number(balance) / Number(10n ** 18n);

    // If the balance is less than 0.5, we will not trade
    if (normalizedBalance < 0.5) {
      console.log('Please top up virtual token balance!');
      return false;
    }

    const amount = normalizedBalance * 0.25; // Always take 25% of total balance
    // Convert back to wei for contract interaction
    return BigInt(Math.floor(amount * Number(10n ** 18n)));
  }

  /**
   * Use the Alchemy sdk to get the current price of the virtual token
   */
  async getVirtualTokenPrice() {
    // Request parameters
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        addresses: [
          {
            network: 'base-mainnet',
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

  /**
   * The listener calls this to process a new prototype that was launched on the virtuals protocol
   */
  async handleLaunchedAgent(pairAddress, tokenAddress) {
    let agent;

    // Add pair to the pairs map
    this.addPair(pairAddress);

    // Get agent info from bonding contract
    agent = await agentTokenInfo(tokenAddress);

    // Stop if theres no agent data
    if (!agent) {
      console.log('Agent not found');
      console.log('');
      // Add to unhandledAgents list for further processing
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
    const normalizedMarketCap = (agent.data.marketCap / 10 ** 18) * virtualPrice;

    // Get current price set target price (increase of 20%) and buy
    const currentPrice = agent.data.price;
    const targetPrice = currentPrice * 1.2; // 20% increase
    const stopLoss = currentPrice - currentPrice * 0.4; // 40% decrease

    console.log('Normalized market cap: ', normalizedMarketCap);
    console.log('Target price: ', targetPrice);
    console.log('Current price: ', currentPrice);
    console.log('Stop loss: ', stopLoss);
    console.log('');

    // Buy the token
    this.buyToken(tokenAddress, pairAddress, targetPrice, stopLoss);
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

  /**
   * Gets the length of all the pairs
   */
  async getAllPairsLength() {
    try {
      const factory = new ethers.Contract(
        FFACTORY_ADDRESS,
        FFACTORY_INTERFACE,
        await this.alchemy.config.getProvider()
      );
      return await factory.allPairsLength();
    } catch (error) {
      throw new Error('| App.js | Error getting all pairs length\n', error);
    }
  }

  /**
   * Adds a pair to the list
   */
  addPair(pair) {
    this.pairs.set(pair);
  }

  /**
   * Adds a prototype to the list
   */
  addPrototype(tokenInfo) {
    this.prototypes.set(tokenInfo.token, tokenInfo);
  }

  /**
   * Adds a sentient to the list
   */
  addSentient(tokenInfo) {
    this.sentients.set(tokenInfo.token, tokenInfo);
  }
}

module.exports = App;
