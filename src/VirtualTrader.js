const { Alchemy, Wallet, Contract } = require("alchemy-sdk");
const { ethers } = require("ethers");
const util = require("util");
const { exec } = require("child_process");
const execPromise = util.promisify(exec);

const {
  UNSAFE_PASSWORD_FILE,
  VIRTUAL_TRADER_ADDRESS,
  BASE_MAINNET,
  VIRTUAL_TRADER_INTERFACE,
  VIRTUAL_TRADER_ABI,
} = require("./utils/config");

// Set the alchemy provider to the Base mainnet
const alchemy = new Alchemy(BASE_MAINNET);

class VirtualTrader {
  constructor() {
    this.signer = null;
    this.virtualTraderContract = null;
    this.provider = null;
  }

  async initialize() {
    // Get provider first
    this.provider = await alchemy.config.getProvider();

    // Get signer and connect it to provider
    this.signer = await this.getSigner();

    // Create contract instance
    this.virtualTraderContract = new Contract(
      VIRTUAL_TRADER_ADDRESS,
      VIRTUAL_TRADER_ABI,
      this.signer
    );

    return this;
  }

  async getSigner() {
    let command = `cast wallet decrypt-keystore virty --unsafe-password "${UNSAFE_PASSWORD_FILE}"`;

    // Execute the command
    const { stdout, stderr } = await execPromise(command);
    if (stderr) {
      throw new Error(`Error decrypting keystore: ${stderr}`);
    }

    // The private key is returned in the stdout
    const privateKey = stdout.slice(24).trim();

    return new Wallet(privateKey, alchemy);
  }

  async buy(token, amount) {
    try {
      if (!this.virtualTraderContract) {
        throw new Error("Contract not initialized");
      }

      const tx = await this.virtualTraderContract.buy(token, amount);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error executing buy:", error);
      return false;
    }
  }

  async sell(token, amount) {
    try {
      if (!this.virtualTraderContract) {
        throw new Error("Contract not initialized");
      }
      const tx = await this.virtualTraderContract.sell(token, amount, {
        gasLimit: 300000n,
        maxPriorityFeePerGas: 100000000n, // 0.1 Gwei
        maxFeePerGas: 1000000000n, // 1 Gwei
      });
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error executing sell:", error);
      return false;
    }
  }

  async withdraw() {
    try {
      if (!this.virtualTraderContract) {
        throw new Error("Contract not initialized");
      }
      const tx = await this.virtualTraderContract.withdraw();
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error executing withdraw:", error);
      return false;
    }
  }

  async withdrawToken(token, amount) {
    try {
      if (!this.virtualTraderContract) {
        throw new Error("Contract not initialized");
      }

      const tx = await this.virtualTraderContract.withdrawToken(token, amount, {
        gasLimit: 300000n,
        maxPriorityFeePerGas: 100000000n, // 0.1 Gwei
        maxFeePerGas: 1000000000n, // 1 Gwei
      });
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error executing withdrawToken:", error);
      return false;
    }
  }

  async getBalance(token) {
    try {
      if (!this.virtualTraderContract || !this.provider) {
        throw new Error("Contract or provider not initialized");
      }

      const balance = await this.virtualTraderContract.getBalance(token);

      return BigInt(balance.toString());
    } catch (error) {
      console.error("Error getting balance:", error);
    }
  }
}

module.exports = VirtualTrader;
