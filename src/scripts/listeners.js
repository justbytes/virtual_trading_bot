const { Alchemy } = require("alchemy-sdk");
const ethers = require("ethers");
const { agentTokenInfo } = require("./getAgentInfo");

const {
  BASE_MAINNET,
  BONDING_ADDRESS,
  BONDING_INTERFACE,
  FERC20_INTERFACE,
  FPAIR_INTERFACE,
} = require("../utils/config");

// Set the alchemy provider to the Base mainnet
const alchemy = new Alchemy(BASE_MAINNET);

// ** SOON TO BE IMPLEMENTED **
const prototypeMCListener = async (app, pairAddress, tokenAddress) => {
  const filter = {
    address: pairAddress,
    topics: [FPAIR_INTERFACE.getEvent("Swap").topicHash],
  };

  const listener = async (log) => {
    const pairContract = new ethers.Contract(
      pairAddress,
      FPAIR_INTERFACE,
      await alchemy.config.provider()
    );

    const bondingContract = new ethers.Contract(
      BONDING_ADDRESS,
      BONDING_INTERFACE,
      await alchemy.config.provider()
    );

    const tokenInfo = await getAgentInfo(tokenAddress);

    const reserves = pairContract.getReserves();
    const grad_threshold = bondingContract.gradThreshold();

    const initial_supply = tokenInfo.data.supply;
    const total_needed_reduction = initial_supply - grad_threshold;
    const current_reduction = initial_supply - reserves[0];

    const progress_to_goal = (current_reduction / total_needed_reduction) * 100;

    if (progress_to_goal >= 95) {
      console.log("Token is 95% to graduation");
      const targetPrice = tokenInfo.data.price * 1.2;
      app.buyToken(tokenAddress, targetPrice);
      alchemy.ws.off(filter, listener);
    } else {
      console.log("Progress to goal: ", progress_to_goal);
    }
  };

  alchemy.ws.on(filter, listener);
};

const activateTargetPriceListener = (
  app,
  targetPrice,
  tokenAddress,
  stopLoss
) => {
  console.log("Activating target price listener");
  const filter = {
    address: pairAddress,
    topics: [FPAIR_INTERFACE.getEvent("Swap").topicHash],
  };

  const listener = async (log) => {
    let tokenInfo;
    // const decoded = FPAIR_INTERFACE.parseLog(log);
    // const { amount0In, amount0Out, amount1In, amount1Out } = decoded.args;

    tokenInfo = await agentTokenInfo(tokenAddress);

    if (!tokenInfo) {
      console.log(
        "There was an error getting the token info on the target price listener.\n Closing current position"
      );
      app.sellToken(tokenAddress);
      alchemy.ws.off(filter, listener);
      return;
    }

    console.log("");
    console.log("--------------- Token Transferred -----------------");
    console.log("Token: ", tokenAddress);
    console.log(
      Number(targetPrice) - Number(tokenInfo.data.price),
      "difference"
    );
    console.log("Target price: ", targetPrice);
    console.log("Current price: ", tokenInfo.data.price);
    console.log("Stop loss: ", stopLoss);
    console.log("---------------------------------------------------");
    console.log("");

    if (tokenInfo.data.price >= targetPrice) {
      console.log("Price target hit!");
      app.sellToken(tokenAddress);
      alchemy.ws.off(filter, listener);
      console.log("Target price listener removed");
    } else if (tokenInfo.data.price < stopLoss) {
      console.log("Stop loss hit!");
      app.sellToken(tokenAddress);
      alchemy.ws.off(filter, listener);
      console.log("Target price listener removed");
    } else {
      console.log("Price target not hit, waiting for price to reach target");
    }
  };

  alchemy.ws.on(filter, listener);
};

/**
 * Activates a listener for the Launched event which happens after a new FERC20 token pair has been created
 */
const activateLaunchedListener = async (app) => {
  console.log("Activating launched listener");
  const filter = {
    address: BONDING_ADDRESS,
    topics: [BONDING_INTERFACE.getEvent("Launched").topicHash],
  };

  alchemy.ws.on(filter, async (log) => {
    const decoded = BONDING_INTERFACE.parseLog(log);
    const { token, pair, n } = decoded.args;

    console.log("");
    console.log("--------------------------------");
    console.log("LAUNCHED EVENT TRIGGERED");
    console.log("Token: ", token);
    console.log("Pair: ", pair);
    console.log("--------------------------------");
    console.log("");

    await app.handleLaunchedAgent(pair, token);
  });
};

/**
 * Activates a listener for the Graduated event which happens after a token has exceeded the bonding period
 */
const activateGraduatedListener = () => {
  const filter = {
    address: BONDING_ADDRESS,
    topics: [BONDING_INTERFACE.getEvent("Graduated").topicHash],
  };

  alchemy.ws.on(filter, (log) => {
    console.log("Token Graduated");
    const decoded = BONDING_INTERFACE.parseLog(log);
    const { oldToken, agentToken } = decoded.args;
    console.log("--------------------------------");
    console.log("GRADUATED EVENT TRIGGERED");
    console.log("Old token address: ", oldToken);
    console.log("Agent token address: ", agentToken);
    console.log("--------------------------------");
    console.log("");
  });

  // TODO: Check if we own any of the old token : if so we need to call the unwrap function in the Bonding contract
  // TODO: If we don't own any we should buy some then and sell it after a 25% gain and then begin a trading algorithm
};

module.exports = {
  activateTargetPriceListener,
  activateLaunchedListener,
};
