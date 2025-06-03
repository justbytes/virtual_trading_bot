const { Alchemy } = require('alchemy-sdk');
const ethers = require('ethers');

const {
  BASE_MAINNET,
  VIRTUAL_TOKEN_ADDRESS,
  FPAIR_INTERFACE,
  BONDING_ADDRESS,
  BONDING_INTERFACE,
} = require('../utils/config');

// Create an Alchemy provider
const alchemy = new Alchemy(BASE_MAINNET);

/**
 * Formats the token data
 */
const formatTokenData = prototype => {
  return {
    creator: prototype.creator,
    token: prototype.token,
    pair: prototype.pair,
    agentToken: prototype.agentToken,
    data: {
      token: prototype.data.token,
      name: prototype.data.name,
      _name: prototype.data._name,
      ticker: prototype.data.ticker,
      supply: prototype.data.supply.toString(), // Convert BigNumber to string
      price: prototype.data.price.toString(),
      marketCap: prototype.data.marketCap.toString(),
      liquidity: prototype.data.liquidity.toString(),
      volume: prototype.data.volume.toString(),
      volume24H: prototype.data.volume24H.toString(),
      prevPrice: prototype.data.prevPrice.toString(),
      lastUpdated: prototype.data.lastUpdated.toString(),
    },
    description: prototype.description,
    cores: prototype.cores,
    image: prototype.image,
    twitter: prototype.twitter,
    telegram: prototype.telegram,
    youtube: prototype.youtube,
    website: prototype.website,
    trading: prototype.trading,
    tradingOnUniswap: prototype.tradingOnUniswap,
  };
};

/**
 * Gets all of the token data
 */
const agentTokenInfo = async tokenAddress => {
  let agent;

  agent = await getTokenInfo(tokenAddress);

  if (!agent) {
    return false;
  }

  // There should be no 0 priced tokens
  if (agent.data.price == 0) {
    const maxAttempts = 10; // Maximum number of retry attempts
    let attempts = 0; // Counter for the number of attempts

    while ((agent.data.price == 0 || agent.data.marketCap == 0) && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between attempts
      agent = await getTokenInfo(tokenAddress);
      attempts++;
    }

    if (agent.data.price == 0) {
      console.log(`Failed to get non-zero price after ${maxAttempts} attempts`);
      return false;
    }
  }

  return agent;
};

/**
 * gets the agent from a pair address
 */
const getAgentInfoFromPair = async pairAddress => {
  // Create pair contract instance with retry
  const pair = await retryOperation(
    async () =>
      new ethers.Contract(pairAddress, FPAIR_INTERFACE, await alchemy.config.getProvider()),
    `Error creating pair contract instance for ${pairAddress}`
  );

  // Get the tokenA address with retry
  const tokenA = await retryOperation(
    async () => pair.tokenA(),
    `Error getting tokenA for pair ${pairAddress}`
  );

  // Set the correct ferc20 address with retry if needed
  const ferc20 =
    tokenA === VIRTUAL_TOKEN_ADDRESS
      ? await retryOperation(
          async () => pair.tokenB(),
          `Error getting tokenB for pair ${pairAddress}`
        )
      : tokenA;

  return getAgentInfo(ferc20);
};

/**
 * Gets the token infor from the bonding contract
 */
const getTokenInfo = async targetAddress => {
  const bonding = new ethers.Contract(
    BONDING_ADDRESS,
    BONDING_INTERFACE,
    await alchemy.config.getProvider()
  );

  const rawTokenData = await retryOperation(
    async () => bonding.tokenInfo(targetAddress),
    `Error getting token info`
  );

  if (!rawTokenData) {
    return false;
  }

  return formatTokenData(rawTokenData);
};

/**
 * Used for calling a function with retries
 */
const retryOperation = async (operation, errorMessage, maxRetries = 5) => {
  let retry = 0;
  while (retry < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      retry++;
      console.log(`${errorMessage} (attempt ${retry}/${maxRetries})`);
      if (retry === maxRetries) {
        console.log(`${errorMessage} after ${maxRetries} attempts`);
        return false;
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retry) * 1000));
    }
  }
};

module.exports = { agentTokenInfo, getTokenInfo, getAgentInfoFromPair };
