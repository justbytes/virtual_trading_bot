# Virtuals Trading Bot

The Virtuals Trading Bot is a trading bot that can be used to snipe tokens on the Virtuals Protocol bonding curve. It has event listeners for the `Launched` event that trigers a function that gets current prices, sets stop losses, price targets. In addition the Virtuals Trading Bot gathers all of the tokens that have been created via Virtuals Protocol which can then be indexed in the case you need want to track any specifics of tokens graduating or trades events.

- PRICE TARGET: 20% price increase sells 100% of holdings
- STOP LOSS: -40% price decrease sells 100% of holdings

## USAGE

### ALCHEMY RPC URL

This app requires an Alchemy rpc url. You can get a sign up for a free one [here](https://www.alchemy.com/). Once you're signed up you will see a dashboard where you can create a new app. Create a new app and select the Base Mainnet network. Grab the rpc url (starting with https) and paste it into the approprate .env variable using the .env.example for reference.

### Cast Wallet Setup

This bot uses the cast wallet to create a signer. Its recommended to install [Foundry](https://book.getfoundry.sh/introduction/installation/) which comes with cast. From there you can setup a wallet with the following commands.

```
cast wallet import <WALLET_NAME_HERE> --interactive
```

This will prompt you to enter a private key and set a password for the wallet. Once this is complete add the name of the wallet and the password to the .env file.

If you wish to clean up the terminal after this run the following commands but NOTE IT WILL DELETE ALL OF YOUR TERMINAL HISTORY. This is recommended anytime you input sensitive information into the terminal.

```
history -c
rm ~/.bash_history
```

### Install dependencies

Install all dependiencies with:

```
npm install
```

### Getting Virtuals Protocol Data

There are several options for retrieving token data from Virtuals Potocol. Getting the data is not required and the bot can run without it.

#### Get data on startup of App.js

In the index.js file you can set the App.js initialize function with true or false boolean. True will get all of the pairs from the bonding curve contract and will then sort them by prototypes or sentients. By default the initialize() function is set to false and will need to be switched to true if you want the data.

- #### Note that it can take up to an hour to get the data.

```
const main = async () => {
  // Create the alchemy provider configured for Base mainnet
  const alchemy = new Alchemy(BASE_MAINNET);

  // Initialize the app
  const virtualTrader = await new VirtualTrader(alchemy).initialize();

  // .initialize(false) SKIPS DATA RETRIEVAL | .initialize(true)TRUE RETRIEVES DATA
  const app = await new App(virtualTrader, alchemy).initialize(true);
  console.log('----------   PROGRAM STARTED   ------------');
};
```

#### Get data without initializing App.js

If you want to get the data without running the program you can call the getPairs.js and getAgents.js files which will download the data but you need to ensure that you have the data directory in the root and there should be pairs.json, prototypes.json, and sentients.json files inside of the directory.

```
node src/scripts/getPairs.js
```

```
node src/scripts/getAgents.js
```

### Start the program

To run the program you will first need to ensure you have you're wallet setup with cast as described above. You will also need to hold the Virtual token as they are used to purchase tokens on the bonding curve instead of WETH. You will also need to have enough Base WETH to cover gas fees.

```
node src/index.js
```
