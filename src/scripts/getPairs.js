const { Alchemy } = require('alchemy-sdk');
const ethers = require('ethers');
const fs = require('fs');

const {
  BASE_MAINNET,
  FFACTORY_ADDRESS,
  FFACTORY_INTERFACE,
  PAIRS_ARCHIVE_FILE,
} = require('../utils/config');

/**
 * Gets all of the pairs from the virtuals factory contract
 */
const main = async () => {
  const alchemy = new Alchemy(BASE_MAINNET);
  const pairs = [];

  // Create contract instance using Alchemy
  const factory = new ethers.Contract(
    FFACTORY_ADDRESS,
    FFACTORY_INTERFACE,
    await alchemy.config.getProvider()
  );

  // Get total number of pairs
  const pairsLength = await factory.allPairsLength();
  console.log('Total pairs:', pairsLength.toString());

  // Gets the pairs with retries
  const getPair = async index => {
    let retry = 0;
    const maxRetries = 5;
    while (retry < maxRetries) {
      try {
        const pairAddress = await factory.pairs(index);
        return pairAddress;
      } catch (error) {
        retry++;
        console.log(`Error fetching pair ${index} (attempt ${retry}/${maxRetries}):`, error);
        if (retry === maxRetries) {
          throw new Error(`Failed to fetch pair ${index} after ${maxRetries} attempts`);
        }
        // Exponential backoff: wait longer between each retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retry) * 1000));
      }
    }
  };

  // Get all pairs
  for (let i = 0; i < pairsLength; i++) {
    try {
      const pairAddress = await getPair(i);
      if (pairAddress) {
        pairs.push(pairAddress);
        console.log(i);
      }
    } catch (error) {
      console.error(`Failed to fetch pair ${i}:`, error);
      // Store failed indices to potentially retry later
      pairs[i] = null;
    }
  }

  // Filter out any null values from failed attempts
  const validPairs = pairs.filter(pair => pair !== null);
  console.log(validPairs.length);

  // Save pairs to file
  fs.writeFileSync(PAIRS_ARCHIVE_FILE, JSON.stringify(validPairs, null, 2), 'utf8');

  console.log(`Pair addresses saved to pairs.json. Saved: ${validPairs.length} / ${pairsLength}`);
};

main().catch(console.error);
