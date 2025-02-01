const { Alchemy } = require("alchemy-sdk");
const ethers = require("ethers");
const fs = require("fs");

const { getAgentInfo } = require("../scripts/getAgentInfo");

const {
  BASE_MAINNET,
  VIRTUAL_TOKEN_ADDRESS,
  FPAIR_INTERFACE,
  PROTOTYPES_ARCHIVE_FILE,
  SENTIENTS_ARCHIVE_FILE,
  PAIRS_ARCHIVE_FILE,
} = require("../utils/config");

const getAgents = async (pairs) => {
  // Create Alchemy instance
  const alchemy = new Alchemy(BASE_MAINNET);
  const prototypes = [];
  const sentients = [];
  let ferc20, pair, tokenInfo;

  const retryOperation = async (operation, errorMessage, maxRetries = 5) => {
    let retry = 0;
    while (retry < maxRetries) {
      try {
        return await operation();
      } catch (error) {
        retry++;
        console.log(`${errorMessage} (attempt ${retry}/${maxRetries}):`, error);
        if (retry === maxRetries) {
          throw new Error(`${errorMessage} after ${maxRetries} attempts`);
        }
        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, retry) * 1000)
        );
      }
    }
  };

  // Iterate over pairs getting the token info then push it to the appropriate array
  for (let i = 0; i < pairs.length; i++) {
    try {
      // Create pair contract instance with retry
      pair = await retryOperation(
        async () =>
          new ethers.Contract(
            pairs[i],
            FPAIR_INTERFACE,
            await alchemy.config.getProvider()
          ),
        `Error creating pair contract instance for pair ${i}`
      );

      // Get tokenA address with retry
      const tokenA = await retryOperation(
        async () => pair.tokenA(),
        `Error getting tokenA for pair ${i}`
      );

      // Get tokenB if needed, with retry
      ferc20 =
        tokenA === VIRTUAL_TOKEN_ADDRESS
          ? await retryOperation(
              async () => pair.tokenB(),
              `Error getting tokenB for pair ${i}`
            )
          : tokenA;

      // Get the agent info with retry
      tokenInfo = await retryOperation(
        async () => getTokenInfo(ferc20),
        `Error getting agent info for pair ${i}`
      );

      // if the token is trading on uniswap it is sentient
      if (!tokenInfo.tradingOnUniswap) {
        prototypes.push(tokenInfo);
      } else {
        sentients.push(tokenInfo);
      }
      console.log(i);
    } catch (error) {
      console.error(`Failed to process pair ${i}:`, error);
      continue;
    }
  }

  return { prototypes, sentients };
};

const main = async () => {
  // Get the current pairs
  const pairs = JSON.parse(fs.readFileSync(PAIRS_ARCHIVE_FILE, "utf8"));

  // Use the pairs to seperate the agents into prototypes and sentients
  const agents = await getAgents(pairs);

  // Save the agents to the appropriate files
  fs.writeFileSync(
    SENTIENTS_ARCHIVE_FILE,
    JSON.stringify(agents.sentients, null, 2),
    "utf8"
  );

  fs.writeFileSync(
    PROTOTYPES_ARCHIVE_FILE,
    JSON.stringify(agents.prototypes, null, 2),
    "utf8"
  );

  console.log(
    `Agents are seperated and saved to file Saved: ${
      agents.prototypes.length + agents.sentients.length
    } / ${pairs.length}`
  );
};

main().catch(console.error);
