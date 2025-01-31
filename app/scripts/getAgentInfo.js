const { Alchemy } = require("alchemy-sdk");
const ethers = require("ethers");

const {
  BASE_MAINNET,
  VIRTUAL_TOKEN_ADDRESS,
  FPAIR_INTERFACE,
  BONDING_ADDRESS,
  BONDING_INTERFACE,
} = require("../utils/config");

const alchemy = new Alchemy(BASE_MAINNET);

const formatTokenData = (prototype) => {
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

const getAgentInfo = async (targetAddress) => {
  const bonding = new ethers.Contract(
    BONDING_ADDRESS,
    BONDING_INTERFACE,
    await alchemy.config.getProvider()
  );

  const tokenInfo = await bonding.tokenInfo(targetAddress);

  return formatTokenData(tokenInfo);
};

const getAgentInfoFromPair = async (pairAddress) => {
  const pair = new ethers.Contract(
    pairAddress,
    FPAIR_INTERFACE,
    await alchemy.config.getProvider()
  );

  // Get the tokenA address
  const tokenA = await pair.tokenA();

  // Set the correct ferc20 address
  if (tokenA === VIRTUAL_TOKEN_ADDRESS) {
    ferc20 = await pair.tokenB();
  } else {
    ferc20 = tokenA;
  }

  return getAgentInfo(ferc20);
};

module.exports = { getAgentInfo, getAgentInfoFromPair };
