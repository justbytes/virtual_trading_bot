![pump display banner](/assets/virtuals_banner.jpeg)

# 🤖 Virtuals Trading Bot
Algorithmic trading bot designed for the Virtuals Protocol bonding curve ecosystem on Base mainnet. The system employs real-time event monitoring to automatically detect newly launched tokens and execute trades with the ability to set custom risk management strategies.

## 🌐 Live Demo
[Watch Demo](https://www.youtube.com/watch?v=3mpz4I8A5D4)

## ✨ Features
**Real-time Token Detection**
- Monitors blockchain events to instantly identify new FERC20 token launches on Virtuals Protocol
- WebSocket-based event listeners for `Launched` events on bonding curve contract

**Trading Logic**
- Implements automated buying with 20% profit targets and 40% stop-loss protection
- Dynamic portfolio allocation with 25% balance per trade, maximum 4 concurrent positions
- Automatic Virtual token withdrawal when contract balance exceeds 50 VIRT threshold

**Comprehensive Data Management**
- Archives and indexes all protocol tokens, separating prototypes from graduated sentient tokens
- JSON-based persistence with automatic 10-minute data saving intervals
- Efficient pair tracking and token categorization system

**Advanced Risk Management**
- Multi-tier event system with price monitoring and graduation tracking
- Exponential backoff retry logic for robust blockchain interaction
- Comprehensive transaction validation and error handling

**Secure Wallet Integration**
- Cast wallet system with encrypted keystore management via Foundry
- Automatic nonce management for transaction sequencing
- Secure private key handling with terminal history cleanup

**Market Analysis Tools**
- Real-time Virtual token price fetching via Alchemy API
- Market cap calculations and graduation threshold monitoring
- Bonding curve mathematics for accurate price estimation

🛠 Tech Stack
**Backend & Infrastructure**
- Node.js
- JavaScript ES6+
- Alchemy SDK
- Ethers.js v6
- Base Mainnet (Layer 2)

**Blockchain Integration**
- WebSocket Event Listeners
- Cast Wallet (Foundry)
- Smart Contract Interaction
- Real-time RPC Calls

**Development & Testing**
- Solidity ^0.8.20
- Foundry Framework
- Jest Testing Framework
- OpenZeppelin Contracts

**Data Management**
- JSON File System
- Map-based In-memory Storage
- Automated Data Persistence
- File System Utilities

## 🏗 Architecture
**Event-Driven Trading System**
This bot uses a event-driven architecture:

**Real-time Monitoring**
- **Launch Detection**: WebSocket listeners monitor `Launched` events from the bonding curve contract
- **Price Tracking**: Transfer event listeners track token price movements for active positions
- **Graduation Monitoring**: Detects when tokens graduate from bonding curve to Uniswap

**Smart Contract Integration**
- **VirtualTrader Contract**: Custom Solidity contract for secure token trading operations
- **Bonding Curve Interface**: Direct integration with Virtuals Protocol smart contracts
- **Automated Approvals**: Intelligent token approval management for seamless transactions

**Data Architecture**
- **Dual Storage**: In-memory Maps for fast access, JSON files for persistence
- **Token Classification**: Automatic separation of prototype vs sentient tokens
- **Pair Tracking**: Comprehensive indexing of all trading pairs on the protocol

## 🚀 Quick Start
**Prerequisites**
- Node.js 18+
- Foundry installed and configured
- Alchemy API key (Base Mainnet)
- Virtual (VIRT) tokens for trading
- Base ETH for gas fees

**1. Environment Setup**
Create a `.env` file using the provided `.env.example`:
```
ALCHEMY_KEY=your_alchemy_api_key
BASE_MAINNET_RPC_URL=your_base_mainnet_rpc_url
WALLET_ADDRESS=your_phantom_wallet_address
CAST_WALLET_NAME=your_cast_wallet_name
CAST_WALLET_PASSWORD=your_cast_wallet_password
```

**2. Install Dependencies**
```bash
npm install
```

**3. Cast Wallet Setup**
Set up your trading wallet using Foundry's Cast tool:
```bash
cast wallet import <WALLET_NAME_HERE> --interactive
```
This will prompt for your private key and wallet password.

**Security Note**: Clean terminal history after setup:
```bash
history -c
rm ~/.bash_history
```

**4. Initial Data Setup (Optional)**
Configure initial token indexing - this can take up to an hour:
```bash
node src/scripts/getPairs.js
node src/scripts/getAgents.js
```

**5. Start the Trading Bot**
```bash
node src/index.js
```

### The bot will:
- Initialize event listeners for new token launches
- Begin monitoring for trading opportunities
- Automatically execute trades based on configured parameters

## 🔧 Trading Configuration
**Risk Parameters**
- **Profit Target**: 20% price increase triggers 100% position sale
- **Stop Loss**: 40% price decrease triggers 100% position sale
- **Max Positions**: 4 concurrent trades maximum
- **Position Size**: 25% of available Virtual token balance per trade

**Data Management**
- **Auto-save**: Data persisted every 10 minutes
- **Token Indexing**: Continuous monitoring of new protocol pairs
- **Classification**: Automatic prototype/sentient token categorization

## 🔧 Smart Contract Development
This project includes a comprehensive Solidity smart contract suite built with Foundry:

**VirtualTrader Contract**
- Custom trading contract with owner-only access controls
- Automated Virtual token balance management (50 VIRT threshold)
- Secure buy/sell functions with approval handling
- Emergency withdrawal capabilities for both native and ERC20 tokens

**Foundry Integration**
- Complete test suite with mocking and Base mainnet forking
- Deployment scripts with network configuration management
- Helper contracts for streamlined testing and deployment
- Integration with OpenZeppelin security standards

**Contract Features**
- ReentrancyGuard protection for secure trading operations
- Custom error handling for gas-efficient reverts
- Automated excess token withdrawal to owner wallet
- Comprehensive balance checking and management utilities
