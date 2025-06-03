require('dotenv').config();
const { Network } = require('alchemy-sdk');
const { ethers } = require('ethers');
const path = require('path');

/**
 * @description This file is used to store / manage constant values like
 *              contract addresses, interfaces, abis, networks, etc.
 */

/*//////////////////////////////////////////////////////////////
                           CONTRACT ADDRESSES
//////////////////////////////////////////////////////////////*/
const VIRTUAL_TOKEN_ADDRESS = '0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b';
const FFACTORY_ADDRESS = '0x158d7CcaA23DC3c8861c3323eD546E3d25e74309';
const BONDING_ADDRESS = '0xF66DeA7b3e897cD44A5a231c61B6B4423d613259';
const FROUTER_ADDRESS = '0x83358384d0c96db98dca34b9c0527f567ceee5e9';
const VIRTUAL_TRADER_ADDRESS = '0x585f75d428C74094D4e547D9ef2b1b1B2eCD40Be';
/*//////////////////////////////////////////////////////////////
                             CONTRACT ABIS
//////////////////////////////////////////////////////////////*/
const BONDING_ABI = require('../../abis/Bonding.json');
const VIRTUAL_TOKEN_ABI = require('../../abis/VirtualToken.json');
const FFACTORY_ABI = require('../../abis/FFactory.json');
const FPAIR_ABI = require('../../abis/FPair.json');
const FERC20_ABI = require('../../abis/FERC20.json');
const VIRTUAL_TRADER_ABI = require('../../abis/VirtualTrader.json');
/*//////////////////////////////////////////////////////////////
                          CONTRACT INTERFACES
//////////////////////////////////////////////////////////////*/
const BONDING_INTERFACE = new ethers.Interface(BONDING_ABI);
const FFACTORY_INTERFACE = new ethers.Interface(FFACTORY_ABI);
const FPAIR_INTERFACE = new ethers.Interface(FPAIR_ABI);
const FERC20_INTERFACE = new ethers.Interface(FERC20_ABI);
const VIRTUAL_TRADER_INTERFACE = new ethers.Interface(VIRTUAL_TRADER_ABI);
/*//////////////////////////////////////////////////////////////
                                NETWORKS
//////////////////////////////////////////////////////////////*/

const BASE_MAINNET = {
  apiKey: process.env.ALCHEMY_KEY,
  network: Network.BASE_MAINNET,
};

/*//////////////////////////////////////////////////////////////
                             DATA ARCHIVES
//////////////////////////////////////////////////////////////*/
const findProjectRoot = () => {
  let currentDir = __dirname;
  while (currentDir !== path.parse(currentDir).root) {
    try {
      require(path.join(currentDir, 'package.json'));
      return currentDir;
    } catch (e) {
      currentDir = path.dirname(currentDir);
    }
  }
  // Fallback to going up from src/utils to project root
  return path.resolve(__dirname, '../..');
};

const PROJECT_ROOT = findProjectRoot();

const PROTOTYPES_ARCHIVE_FILE = path.join(PROJECT_ROOT, 'data', 'prototypes.json');
const SENTIENTS_ARCHIVE_FILE = path.join(PROJECT_ROOT, 'data', 'sentients.json');
const PAIRS_ARCHIVE_FILE = path.join(PROJECT_ROOT, 'data', 'pairs.json');

/*//////////////////////////////////////////////////////////////
                             WALLET
//////////////////////////////////////////////////////////////*/
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const CAST_WALLET_PASSWORD = process.env.CAST_WALLET_PASSWORD;
const CAST_WALLET_NAME = process.env.CAST_WALLET_NAME;

module.exports = {
  WALLET_ADDRESS,
  VIRTUAL_TRADER_ABI,
  CAST_WALLET_PASSWORD,
  CAST_WALLET_NAME,
  VIRTUAL_TRADER_INTERFACE,
  FERC20_INTERFACE,
  FERC20_ABI,
  PROTOTYPES_ARCHIVE_FILE,
  PAIRS_ARCHIVE_FILE,
  BASE_MAINNET,
  BONDING_ADDRESS,
  BONDING_INTERFACE,
  VIRTUAL_TOKEN_ADDRESS,
  FFACTORY_INTERFACE,
  FFACTORY_ADDRESS,
  FROUTER_ADDRESS,
  BONDING_ABI,
  VIRTUAL_TOKEN_ABI,
  FPAIR_INTERFACE,
  SENTIENTS_ARCHIVE_FILE,
  VIRTUAL_TRADER_ADDRESS,
};
