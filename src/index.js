const { Alchemy } = require('alchemy-sdk');

// Import apps
const App = require('./App');
const VirtualTrader = require('./VirtualTrader');

// Get the base mainnet config
const { BASE_MAINNET } = require('./utils/config');

/**
 * Initialize the App and VirtualTrader classes
 */
const main = async () => {
  // Create the alchemy provider configured for Base mainnet
  const alchemy = new Alchemy(BASE_MAINNET);

  // Initialize the app
  const virtualTrader = await new VirtualTrader(alchemy).initialize();
  const app = await new App(virtualTrader, alchemy).initialize(false);
  console.log('----------   PROGRAM STARTED   ------------');

  // Test the buy
  // const amount = 1e18;
  // app.virtualTrader.buy('0x0A32C7fc74A35a9BFd99623C2aF309BB9469733E', amount);
};

main().catch(console.error);
