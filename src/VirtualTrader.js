const { Contract, Wallet } = require('alchemy-sdk');
const util = require('util');
const { exec } = require('child_process');
const execPromise = util.promisify(exec);

const {
  CAST_WALLET_PASSWORD,
  CAST_WALLET_NAME,
  VIRTUAL_TRADER_ADDRESS,
  BASE_MAINNET,
  VIRTUAL_TRADER_ABI,
  BONDING_ADDRESS,
  BONDING_ABI,
  VIRTUAL_TOKEN_ABI,
  VIRTUAL_TOKEN_ADDRESS,
} = require('./utils/config');

/**
 * This class buys and sells tokens on the Virtuals Protocol bonding curve
 */
class VirtualTrader {
  /**
   * Constructor initialize class varaibles
   */
  constructor(alchemy) {
    this.alchemy = alchemy;
    this.signer = null;
    this.virtualTraderContract = null;
    this.provider = null;
    this.currentNonce = null;
  }

  /**
   * Initialize provider, signer, nonce, and virtual trading contract(currently used)
   */
  async initialize() {
    // Get provider first
    this.provider = await this.alchemy.config.getProvider();

    // Get signer and connect it to provider
    this.signer = await this.getSigner();

    // Initialize the nonce
    this.currentNonce = await this.provider.getTransactionCount(this.signer.address, 'latest');

    // Create contract instance
    this.virtualTraderContract = new Contract(
      VIRTUAL_TRADER_ADDRESS,
      VIRTUAL_TRADER_ABI,
      this.signer
    );

    return this;
  }

  /**
   * Creats a wallet/signer instance using the cast wallet
   */
  async getSigner() {
    // Runs the cast wallet command to get the private key for the trading wallet
    let command = `cast wallet decrypt-keystore ${CAST_WALLET_NAME} --unsafe-password "${CAST_WALLET_PASSWORD}"`;

    // Execute the command
    const { stdout, stderr } = await execPromise(command);
    if (stderr) {
      throw new Error(`Error decrypting keystore: ${stderr}`);
    }

    // The private key is returned in the stdout
    const privateKey = stdout.slice(26).trim();

    return new Wallet(privateKey, this.alchemy);
  }

  /**
   * Buy the tokens on the Virtuals Protocol bonding curve
   */
  async buy(token, amount) {
    try {
      const bondingContract = new Contract(BONDING_ADDRESS, BONDING_ABI, this.signer);

      // Create ERC20 token contract instance
      const tokenContract = new Contract(token, VIRTUAL_TOKEN_ABI, this.signer);

      const amountBN = BigInt(amount);

      // Get fresh nonce for approve transaction
      const approveNonce = this.currentNonce++;

      // Approve the bonding contract to spend tokens
      const approveTx = await tokenContract.approve(_ADDRESS, amountBN, {
        nonce: approveNonce,
      });
      await approveTx.wait();
      console.log('Approved');

      // Get fresh nonce for buy transaction
      const buyNonce = this.currentNonce++;

      // Now proceed with the buy
      const buyTx = await bondingContract.buy(token, amountBN, {
        nonce: buyNonce,
      });
      const receipt = await buyTx.wait();

      return receipt.status === 1;
    } catch (error) {
      // If there's an error, refresh the nonce
      this.currentNonce = await this.provider.getTransactionCount(this.signer.address, 'latest');
      console.log('There was an error when buying: ', error);
      console.log('');
      return false;
    }
  }

  /**
   * Sell the tokens on the Virutals Protocol bonding curve
   */
  async sell(token, amount) {
    try {
      const bondingContract = new Contract(BONDING_ADDRESS, BONDING_ABI, this.signer);

      const success = await bondingContract.sell.call(amount, token);
      if (!success) {
        console.log('Transaction Failed');
        return false;
      }

      return success;
    } catch (error) {
      console.log('There was an error when buying: ', error);
      console.log('');
    }
  }

  // async buy(token, amount, retryCount = 10, initialDelay = 1000) {
  //   for (let attempt = 1; attempt <= retryCount; attempt++) {
  //     try {
  //       console.log(`Executing buy (Attempt ${attempt}/${retryCount})`);

  //       // Get gas estimate and convert to BigInt
  //       const gasEstimate = await this.virtualTraderContract.estimateGas.buy(
  //         token,
  //         amount
  //       );
  //       const gasEstimateBigInt = BigInt(gasEstimate.toString());

  //       // Get current gas prices from network
  //       const { maxFeePerGas, maxPriorityFeePerGas } =
  //         await this.provider.getFeeData();

  //       // Add 20% buffer to gas estimate for safety (all values as BigInt)
  //       const gasLimit = (gasEstimateBigInt * 120n) / 100n;

  //       const tx = await this.virtualTraderContract.buy(token, amount, {
  //         gasLimit,
  //         maxFeePerGas: BigInt(maxFeePerGas.toString()),
  //         maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas.toString()),
  //       });

  //       await tx.wait();
  //       console.log("Buy transaction successful");
  //       return true;
  //     } catch (error) {
  //       console.error(
  //         `Error executing buy (Attempt ${attempt}):`,
  //         error.message
  //       );

  //       // if (error.code === "INSUFFICIENT_FUNDS") {
  //       //   console.error("Not enough funds to cover gas costs");
  //       //   return false;
  //       // }

  //       if (attempt === retryCount) {
  //         console.error("Max retry attempts reached");
  //         return false;
  //       }

  //       const delay = initialDelay * Math.pow(2, attempt - 1);
  //       console.log(`Retrying in ${delay / 1000} seconds...`);
  //       await new Promise((resolve) => setTimeout(resolve, delay));
  //     }
  //   }
  //   return false;
  // }

  // async sell(token, amount, retryCount = 10, initialDelay = 1000) {
  //   for (let attempt = 1; attempt <= retryCount; attempt++) {
  //     try {
  //       console.log(`Executing sell (Attempt ${attempt}/${retryCount})`);

  //       // Get gas estimate and convert to BigInt
  //       const gasEstimate = await this.virtualTraderContract.estimateGas.sell(
  //         token,
  //         amount
  //       );
  //       const gasEstimateBigInt = BigInt(gasEstimate.toString());

  //       // Get current gas prices from network
  //       const { maxFeePerGas, maxPriorityFeePerGas } =
  //         await this.provider.getFeeData();

  //       // Add 20% buffer to gas estimate for safety
  //       const gasLimit = (gasEstimateBigInt * 120n) / 100n;

  //       const tx = await this.virtualTraderContract.sell(token, amount, {
  //         gasLimit,
  //         maxFeePerGas: BigInt(maxFeePerGas.toString()),
  //         maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas.toString()),
  //       });

  //       await tx.wait();
  //       console.log("Sell transaction successful");
  //       return true;
  //     } catch (error) {
  //       console.error(
  //         `Error executing sell (Attempt ${attempt}):`,
  //         error.message
  //       );

  //       if (attempt === retryCount) {
  //         console.error("Max retry attempts reached");
  //         return false;
  //       }

  //       const delay = initialDelay * Math.pow(2, attempt - 1);
  //       console.log(`Retrying in ${delay / 1000} seconds...`);
  //       await new Promise((resolve) => setTimeout(resolve, delay));
  //     }
  //   }
  //   return false;
  // }

  // async withdraw(retryCount = 3, initialDelay = 1000) {
  //   for (let attempt = 1; attempt <= retryCount; attempt++) {
  //     try {
  //       if (!this.virtualTraderContract) {
  //         throw new Error("Contract not initialized");
  //       }

  //       console.log(`Executing withdraw (Attempt ${attempt}/${retryCount})`);

  //       const tx = await this.virtualTraderContract.withdraw();
  //       await tx.wait();
  //       console.log("Withdraw transaction successful");
  //       return true;
  //     } catch (error) {
  //       console.error(
  //         `Error executing withdraw (Attempt ${attempt}):`,
  //         error.message
  //       );

  //       if (attempt === retryCount) {
  //         console.error("Max retry attempts reached");
  //         return false;
  //       }

  //       const delay = initialDelay * Math.pow(2, attempt - 1);
  //       console.log(`Retrying in ${delay / 1000} seconds...`);
  //       await new Promise((resolve) => setTimeout(resolve, delay));
  //     }
  //   }
  // }

  // async withdrawToken(token, amount, retryCount = 3, initialDelay = 1000) {
  //   for (let attempt = 1; attempt <= retryCount; attempt++) {
  //     try {
  //       if (!this.virtualTraderContract) {
  //         throw new Error("Contract not initialized");
  //       }

  //       console.log(
  //         `Executing withdrawToken (Attempt ${attempt}/${retryCount})`
  //       );

  //       // Convert amount to BigInt if it isn't already
  //       const amountBigInt = BigInt(amount.toString());

  //       // Get gas estimate and convert to BigInt
  //       const gasEstimate =
  //         await this.virtualTraderContract.estimateGas.withdrawToken(
  //           token,
  //           amountBigInt
  //         );
  //       const gasEstimateBigInt = BigInt(gasEstimate.toString());

  //       // Get current gas prices from network
  //       const { maxFeePerGas, maxPriorityFeePerGas } =
  //         await this.provider.getFeeData();

  //       // Add 20% buffer to gas estimate for safety
  //       const gasLimit = (gasEstimateBigInt * 120n) / 100n;

  //       const tx = await this.virtualTraderContract.withdrawToken(
  //         token,
  //         amountBigInt,
  //         {
  //           gasLimit,
  //           maxFeePerGas: BigInt(maxFeePerGas.toString()),
  //           maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas.toString()),
  //         }
  //       );

  //       await tx.wait();
  //       console.log("WithdrawToken transaction successful");
  //       return true;
  //     } catch (error) {
  //       console.error(
  //         `Error executing withdrawToken (Attempt ${attempt}):`,
  //         error.message
  //       );

  //       if (attempt === retryCount) {
  //         console.error("Max retry attempts reached");
  //         return false;
  //       }

  //       const delay = initialDelay * Math.pow(2, attempt - 1);
  //       console.log(`Retrying in ${delay / 1000} seconds...`);
  //       await new Promise((resolve) => setTimeout(resolve, delay));
  //     }
  //   }
  // }

  // async getBalance(token, retryCount = 10, initialDelay = 1000) {
  //   for (let attempt = 1; attempt <= retryCount; attempt++) {
  //     try {
  //       console.log(
  //         `Getting balance for ${token} (Attempt ${attempt}/${retryCount})`
  //       );

  //       const balance = await this.virtualTraderContract.getBalance(token);

  //       // Check if balance is valid
  //       if (balance === undefined || balance === null || balance === "0x") {
  //         throw new Error("Invalid balance response");
  //       }

  //       const bigIntBalance = BigInt(balance.toString());
  //       console.log("Balance: ", bigIntBalance);
  //       return bigIntBalance;
  //     } catch (error) {
  //       console.error(
  //         `Error getting balance (Attempt ${attempt}):`,
  //         error.message
  //       );

  //       if (attempt === retryCount) {
  //         console.error("Max retry attempts reached. Returning 0n");
  //         return 0n;
  //       }

  //       // Calculate delay with exponential backoff
  //       const delay = initialDelay * Math.pow(2, attempt - 1);
  //       console.log(`Retrying in ${delay / 1000} seconds...`);

  //       // Wait before next attempt
  //       await new Promise((resolve) => setTimeout(resolve, delay));
  //     }
  //   }
  // }
}

module.exports = VirtualTrader;
