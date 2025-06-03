const fs = require('fs');
const path = require('path');
const ethers = require('ethers');
const { Alchemy } = require('alchemy-sdk');

const { getTokenInfo } = require('../scripts/getAgentInfo');

const {
  BASE_MAINNET,
  PROTOTYPES_ARCHIVE_FILE,
  SENTIENTS_ARCHIVE_FILE,
  FFACTORY_ADDRESS,
  FFACTORY_INTERFACE,
  FPAIR_INTERFACE,
  VIRTUAL_TOKEN_ADDRESS,
  PAIRS_ARCHIVE_FILE,
} = require('./config');

// Set the alchemy provider to the Base mainnet
const alchemy = new Alchemy(BASE_MAINNET);

/**
 * Resolves file paths relative to project root
 */
function resolveDataPath(filePath) {
  // If the path is already absolute, use it as is
  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  // Otherwise, resolve it relative to the project root
  return path.resolve(process.cwd(), filePath);
}

/**
 * Ensures the data directory exists and creates it if it doesn't
 */
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');

  try {
    await fs.promises.access(dataDir);
    console.log(`Data directory exists: ${dataDir}`);
  } catch (error) {
    // Directory doesn't exist, create it
    console.log(`Creating data directory: ${dataDir}`);
    await fs.promises.mkdir(dataDir, { recursive: true });
  }
}

/**
 * Ensures a file exists and creates it with default content if it doesn't
 */
async function ensureFile(filePath, defaultContent = '[]') {
  const resolvedPath = resolveDataPath(filePath);

  try {
    await fs.promises.access(resolvedPath);
    console.log(`File exists: ${resolvedPath}`);
  } catch (error) {
    // File doesn't exist, create it
    console.log(`Creating file: ${resolvedPath}`);

    // Ensure the directory exists first
    const dir = path.dirname(resolvedPath);
    await fs.promises.mkdir(dir, { recursive: true });

    await fs.promises.writeFile(resolvedPath, defaultContent, 'utf8');
  }
}

/**
 * Initializes all required files and directories
 */
async function initializeDataStructure() {
  console.log('Initializing data structure...');
  console.log(`Project root: ${process.cwd()}`);
  console.log(`PAIRS_ARCHIVE_FILE: ${PAIRS_ARCHIVE_FILE}`);
  console.log(`PROTOTYPES_ARCHIVE_FILE: ${PROTOTYPES_ARCHIVE_FILE}`);
  console.log(`SENTIENTS_ARCHIVE_FILE: ${SENTIENTS_ARCHIVE_FILE}`);

  await ensureDataDirectory();
  await ensureFile(PAIRS_ARCHIVE_FILE, '[]');
  await ensureFile(PROTOTYPES_ARCHIVE_FILE, '[]');
  await ensureFile(SENTIENTS_ARCHIVE_FILE, '[]');
}

async function loadPairs() {
  let pairs = new Map();

  try {
    const resolvedPath = resolveDataPath(PAIRS_ARCHIVE_FILE);

    // Ensure the file exists first
    await ensureFile(PAIRS_ARCHIVE_FILE, '[]');

    const fileContent = await fs.promises.readFile(resolvedPath, 'utf8');
    const pairsData = JSON.parse(fileContent);

    for (const pair of pairsData) {
      pairs.set(pair);
    }

    console.log(`Loaded ${pairs.size} pairs from file`);
    return pairs;
  } catch (error) {
    console.error('Error loading pairs:', error);
    // Return empty Map if there's an error
    return new Map();
  }
}

async function loadAgents() {
  let prototypes = new Map();
  let sentients = new Map();

  // Load prototypes
  try {
    const resolvedPath = resolveDataPath(PROTOTYPES_ARCHIVE_FILE);

    // Ensure the file exists first
    await ensureFile(PROTOTYPES_ARCHIVE_FILE, '[]');

    const fileContent = await fs.promises.readFile(resolvedPath, 'utf8');

    const prototypesData = JSON.parse(fileContent);
    for (const prototype of prototypesData) {
      prototypes.set(prototype.token, prototype);
    }

    console.log(`Loaded ${prototypes.size} prototypes from file`);
  } catch (error) {
    console.error('Error loading prototypes:', error);
  }

  // Load sentients
  try {
    const resolvedPath = resolveDataPath(SENTIENTS_ARCHIVE_FILE);

    // Ensure the file exists first
    await ensureFile(SENTIENTS_ARCHIVE_FILE, '[]');

    const fileContent = await fs.promises.readFile(resolvedPath, 'utf8');

    const sentientsData = JSON.parse(fileContent);
    for (const sentient of sentientsData) {
      sentients.set(sentient.token, sentient);
    }

    console.log(`Loaded ${sentients.size} sentients from file`);
  } catch (error) {
    console.error('Error loading sentients:', error);
  }

  return { prototypes, sentients };
}

async function saveData(pairs, prototypes, sentients) {
  try {
    // Ensure data directory exists
    await ensureDataDirectory();

    // Convert Maps to arrays
    const pairsArray = Array.from(pairs.keys());
    const prototypesArray = Array.from(prototypes.values());
    const sentientsArray = Array.from(sentients.values());

    // Resolve paths and save files
    const pairsPath = resolveDataPath(PAIRS_ARCHIVE_FILE);
    const prototypesPath = resolveDataPath(PROTOTYPES_ARCHIVE_FILE);
    const sentientsPath = resolveDataPath(SENTIENTS_ARCHIVE_FILE);

    // Save pairs
    await fs.promises.writeFile(pairsPath, JSON.stringify(pairsArray, null, 2), 'utf8');

    // Save prototypes
    await fs.promises.writeFile(prototypesPath, JSON.stringify(prototypesArray, null, 2), 'utf8');

    // Save sentients
    await fs.promises.writeFile(sentientsPath, JSON.stringify(sentientsArray, null, 2), 'utf8');

    console.log(
      `Saved ${pairsArray.length} pairs, ${prototypesArray.length} prototypes, ${sentientsArray.length} sentients`
    );
  } catch (error) {
    console.error('Error saving data:', error);
    throw error;
  }
}

async function updateAgentLists(app, initalPairs, pairsLength) {
  let ferc20;
  let count = 0;

  const factory = new ethers.Contract(
    FFACTORY_ADDRESS,
    FFACTORY_INTERFACE,
    await alchemy.config.getProvider()
  );

  console.log(`Processing pairs from ${initalPairs} to ${pairsLength}...`);

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
          console.log(`Retry ${10 - retries} getting tokenA for pair ${pairAddress}`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between retries
        }
      }

      if (!tokenA) continue; // Skip this iteration if we couldn't get tokenA

      // Set the correct ferc20 address
      if (tokenA === VIRTUAL_TOKEN_ADDRESS) {
        ferc20 = await pair.tokenB();
      } else {
        ferc20 = tokenA;
      }

      const tokenInfo = await getTokenInfo(ferc20);

      if (!tokenInfo) {
        console.log(`Could not get token info for ${ferc20}, skipping...`);
        continue;
      }

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

    count++;
    if (count % 10 === 0) {
      console.log(`Processed ${count} pairs...`);
    }
  }

  console.log(`Finished processing ${count} new pairs`);
}

module.exports = {
  loadAgents,
  saveData,
  loadPairs,
  updateAgentLists,
  initializeDataStructure,
  ensureDataDirectory,
  ensureFile,
  resolveDataPath,
};
