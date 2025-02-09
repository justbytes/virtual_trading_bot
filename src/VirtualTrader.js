const { Alchemy, Contract, Wallet } = require("alchemy-sdk");
const { ethers } = require("ethers");
const util = require("util");
const { exec } = require("child_process");
const execPromise = util.promisify(exec);

const {
  UNSAFE_PASSWORD_FILE,
  VIRTUAL_TRADER_ADDRESS,
  BASE_MAINNET,
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

  async buy(token, amount, retryCount = 10, initialDelay = 1000) {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        console.log(`Executing buy (Attempt ${attempt}/${retryCount})`);

        // Get gas estimate and convert to BigInt
        const gasEstimate = await this.virtualTraderContract.estimateGas.buy(
          token,
          amount
        );
        const gasEstimateBigInt = BigInt(gasEstimate.toString());

        // Get current gas prices from network
        const { maxFeePerGas, maxPriorityFeePerGas } =
          await this.provider.getFeeData();

        // Add 20% buffer to gas estimate for safety (all values as BigInt)
        const gasLimit = (gasEstimateBigInt * 120n) / 100n;

        const tx = await this.virtualTraderContract.buy(token, amount, {
          gasLimit,
          maxFeePerGas: BigInt(maxFeePerGas.toString()),
          maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas.toString()),
        });

        await tx.wait();
        console.log("Buy transaction successful");
        return true;
      } catch (error) {
        console.error(
          `Error executing buy (Attempt ${attempt}):`,
          error.message
        );

        // if (error.code === "INSUFFICIENT_FUNDS") {
        //   console.error("Not enough funds to cover gas costs");
        //   return false;
        // }

        if (attempt === retryCount) {
          console.error("Max retry attempts reached");
          return false;
        }

        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    return false;
  }

  async sell(token, amount, retryCount = 10, initialDelay = 1000) {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        console.log(`Executing sell (Attempt ${attempt}/${retryCount})`);

        // Get gas estimate and convert to BigInt
        const gasEstimate = await this.virtualTraderContract.estimateGas.sell(
          token,
          amount
        );
        const gasEstimateBigInt = BigInt(gasEstimate.toString());

        // Get current gas prices from network
        const { maxFeePerGas, maxPriorityFeePerGas } =
          await this.provider.getFeeData();

        // Add 20% buffer to gas estimate for safety
        const gasLimit = (gasEstimateBigInt * 120n) / 100n;

        const tx = await this.virtualTraderContract.sell(token, amount, {
          gasLimit,
          maxFeePerGas: BigInt(maxFeePerGas.toString()),
          maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas.toString()),
        });

        await tx.wait();
        console.log("Sell transaction successful");
        return true;
      } catch (error) {
        console.error(
          `Error executing sell (Attempt ${attempt}):`,
          error.message
        );

        if (attempt === retryCount) {
          console.error("Max retry attempts reached");
          return false;
        }

        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    return false;
  }

  async withdraw(retryCount = 3, initialDelay = 1000) {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        if (!this.virtualTraderContract) {
          throw new Error("Contract not initialized");
        }

        console.log(`Executing withdraw (Attempt ${attempt}/${retryCount})`);

        const tx = await this.virtualTraderContract.withdraw();
        await tx.wait();
        console.log("Withdraw transaction successful");
        return true;
      } catch (error) {
        console.error(
          `Error executing withdraw (Attempt ${attempt}):`,
          error.message
        );

        if (attempt === retryCount) {
          console.error("Max retry attempts reached");
          return false;
        }

        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async withdrawToken(token, amount, retryCount = 3, initialDelay = 1000) {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        if (!this.virtualTraderContract) {
          throw new Error("Contract not initialized");
        }

        console.log(
          `Executing withdrawToken (Attempt ${attempt}/${retryCount})`
        );

        // Convert amount to BigInt if it isn't already
        const amountBigInt = BigInt(amount.toString());

        // Get gas estimate and convert to BigInt
        const gasEstimate =
          await this.virtualTraderContract.estimateGas.withdrawToken(
            token,
            amountBigInt
          );
        const gasEstimateBigInt = BigInt(gasEstimate.toString());

        // Get current gas prices from network
        const { maxFeePerGas, maxPriorityFeePerGas } =
          await this.provider.getFeeData();

        // Add 20% buffer to gas estimate for safety
        const gasLimit = (gasEstimateBigInt * 120n) / 100n;

        const tx = await this.virtualTraderContract.withdrawToken(
          token,
          amountBigInt,
          {
            gasLimit,
            maxFeePerGas: BigInt(maxFeePerGas.toString()),
            maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas.toString()),
          }
        );

        await tx.wait();
        console.log("WithdrawToken transaction successful");
        return true;
      } catch (error) {
        console.error(
          `Error executing withdrawToken (Attempt ${attempt}):`,
          error.message
        );

        if (attempt === retryCount) {
          console.error("Max retry attempts reached");
          return false;
        }

        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async getBalance(token, retryCount = 10, initialDelay = 1000) {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        console.log(
          `Getting balance for ${token} (Attempt ${attempt}/${retryCount})`
        );

        const balance = await this.virtualTraderContract.getBalance(token);

        // Check if balance is valid
        if (balance === undefined || balance === null || balance === "0x") {
          throw new Error("Invalid balance response");
        }

        const bigIntBalance = BigInt(balance.toString());
        console.log("Balance: ", bigIntBalance);
        return bigIntBalance;
      } catch (error) {
        console.error(
          `Error getting balance (Attempt ${attempt}):`,
          error.message
        );

        if (attempt === retryCount) {
          console.error("Max retry attempts reached. Returning 0n");
          return 0n;
        }

        // Calculate delay with exponential backoff
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay / 1000} seconds...`);

        // Wait before next attempt
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}

module.exports = VirtualTrader;
