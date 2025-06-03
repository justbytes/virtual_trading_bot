require("dotenv").config();
const { Network } = require("alchemy-sdk");
const { ethers } = require("ethers");

/**
 * @description This file is used to store / manage constant values like
 *              contract addresses, interfaces, abis, networks, etc.
 */

/*//////////////////////////////////////////////////////////////
                           CONTRACT ADDRESSES
//////////////////////////////////////////////////////////////*/
const VIRTUAL_TOKEN_ADDRESS = process.env.VIRTUAL_TOKEN_ADDRESS;
const FFACTORY_ADDRESS = process.env.FFACTORY_ADDRESS;
const BONDING_ADDRESS = process.env.BONDING_ADDRESS;
const FROUTER_ADDRESS = process.env.FROUTER_ADDRESS;
const VIRTUAL_TRADER_ADDRESS = process.env.VIRTUAL_TRADER_ADDRESS;
/*//////////////////////////////////////////////////////////////
                             CONTRACT ABIS
//////////////////////////////////////////////////////////////*/
const BONDING_ABI = require("../../abis/Bonding.json");
const VIRTUAL_TOKEN_ABI = require("../../abis/VirtualToken.json");
const FFACTORY_ABI = require("../../abis/FFactory.json");
const FPAIR_ABI = require("../../abis/FPair.json");
const FERC20_ABI = require("../../abis/FERC20.json");
const VIRTUAL_TRADER_ABI = require("../../abis/VirtualTrader.json");
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
const PROTOTYPES_ARCHIVE_FILE = process.env.PROTOTYPES_ARCHIVE_FILE;
const SENTIENTS_ARCHIVE_FILE = process.env.SENTIENTS_ARCHIVE_FILE;
const PAIRS_ARCHIVE_FILE = process.env.PAIRS_ARCHIVE_FILE;

const UNSAFE_PASSWORD_FILE = process.env.UNSAFE_PASSWORD_FILE;

// wallet address
const WALLET_ADDRESS = process.env.VIRT_KEY_ADDRESS;

// File paths
const KEYSTORE_FILE = process.env.KEYSTORE_FILE;

module.exports = {
  WALLET_ADDRESS,
  VIRTUAL_TRADER_ABI,
  UNSAFE_PASSWORD_FILE,
  KEYSTORE_FILE,
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
