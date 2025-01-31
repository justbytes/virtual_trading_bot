const fs = require("fs");
const ethers = require("ethers");
const { Alchemy } = require("alchemy-sdk");

const { getAgentInfo } = require("../scripts/getAgentInfo");

const {
  BASE_MAINNET,
  PROTOTYPES_ARCHIVE_FILE,
  SENTIENTS_ARCHIVE_FILE,
  FFACTORY_ADDRESS,
  FFACTORY_INTERFACE,
  FPAIR_INTERFACE,
  VIRTUAL_TOKEN_ADDRESS,
  PAIRS_ARCHIVE_FILE,
} = require("./config");

// Set the alchemy provider to the Base mainnet
const alchemy = new Alchemy(BASE_MAINNET);

async function loadPairs() {
  let pairs = new Map();
  try {
    const fileContent = await fs.promises.readFile(PAIRS_ARCHIVE_FILE, "utf8");
    const pairsData = JSON.parse(fileContent);
    for (const pair of pairsData) {
      pairs.set(pair);
    }
    return pairs;
  } catch (error) {
    console.error("Error loading pairs:", error);
  }
}

async function loadAgents() {
  let prototypes = new Map();
  let sentients = new Map();

  // Load prototypes
  try {
    const fileContent = await fs.promises.readFile(
      PROTOTYPES_ARCHIVE_FILE,
      "utf8"
    );

    for (const prototype of JSON.parse(fileContent)) {
      prototypes.set(prototype.token, prototype);
    }
  } catch (error) {
    console.error("Error loading prototypes:", error);
  }

  // Load sentients
  try {
    const fileContent = await fs.promises.readFile(
      SENTIENTS_ARCHIVE_FILE,
      "utf8"
    );
    for (const sentient of JSON.parse(fileContent)) {
      sentients.set(sentient.token, sentient);
    }
  } catch (error) {
    console.error("Error loading sentients:", error);
  }

  return { prototypes, sentients };
}

async function saveData(pairs, prototypes, sentients) {
  // Convert Maps to arrays
  const pairsArray = Array.from(pairs.keys());
  const prototypesArray = Array.from(prototypes.values());
  const sentientsArray = Array.from(sentients.values());

  // Save pairs
  await fs.promises.writeFile(
    PAIRS_ARCHIVE_FILE,
    JSON.stringify(pairsArray, null, 2),
    "utf8"
  );

  // Save prototypes
  await fs.promises.writeFile(
    PROTOTYPES_ARCHIVE_FILE,
    JSON.stringify(prototypesArray, null, 2),
    "utf8"
  );

  // Save sentients
  await fs.promises.writeFile(
    SENTIENTS_ARCHIVE_FILE,
    JSON.stringify(sentientsArray, null, 2),
    "utf8"
  );
}

async function updateAgentLists(app, initalPairs, pairsLength) {
  let ferc20;
  let count = 0;

  const factory = new ethers.Contract(
    FFACTORY_ADDRESS,
    FFACTORY_INTERFACE,
    await alchemy.config.getProvider()
  );

  for (let i = initalPairs; i < pairsLength; i++) {
    try {
      const pairAddress = await factory.pairs(i);

      const pair = new ethers.Contract(
        pairAddress,
        FPAIR_INTERFACE,
        await alchemy.config.getProvider()
      );

      // Add retry logic for contract calls
      let retries = 10;
      let tokenA;
      while (retries > 0) {
        try {
          tokenA = await pair.tokenA();
          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            console.error(`Failed to get tokenA for pair after 10 attempts`);
            continue;
          }
          console.log(
            `Retry ${10 - retries} getting tokenA for pair ${pairAddress}`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second between retries
        }
      }

      if (!tokenA) continue; // Skip this iteration if we couldn't get tokenA

      // Set the correct ferc20 address
      if (tokenA === VIRTUAL_TOKEN_ADDRESS) {
        ferc20 = await pair.tokenB();
      } else {
        ferc20 = tokenA;
      }

      const tokenInfo = await getAgentInfo(ferc20);

      if (tokenInfo.tradingOnUniswap) {
        app.addPair(pairAddress);
        app.addSentient(tokenInfo);
      } else {
        app.addPair(pairAddress);
        app.addPrototype(tokenInfo);
      }
    } catch (error) {
      console.error(`Error processing pair ${i}:`, error.message);
      continue; // Skip to next pair if there's an error
    }

    console.log(count);
    count++;
  }
}

module.exports = {
  loadAgents,
  saveData,
  loadPairs,
  updateAgentLists,
};
