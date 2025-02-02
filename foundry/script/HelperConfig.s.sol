pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";

contract HelperConfig is Script {
    NetworkConfig public activeNetworkConfig;
    uint256 public constant ANVIL_PRIVATE_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    struct NetworkConfig {
        address wethTokenAddress;
        address virtualTokenAddress;
        address bondingAddress;
        address frouterAddress;
        uint256 deployerKey;
    }

    constructor() {
        if (block.chainid == 8453) {
            activeNetworkConfig = getBaseMainnetConfig();
        } else {
            activeNetworkConfig = getAnvilConfig();
        }
    }

    function getBaseMainnetConfig() public view returns (NetworkConfig memory) {
        return NetworkConfig({
            wethTokenAddress: 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9,
            virtualTokenAddress: 0xf5c1F61deC83a5994a0cb96d30f8cF7A074B045b,
            bondingAddress: 0x0000000000000000000000000000000000000000,
            frouterAddress: 0x0000000000000000000000000000000000000000,
            deployerKey: vm.envUint("PRIVATE_KEY")
        });
    }

    function getAnvilConfig() public returns (NetworkConfig memory) {
        if (activeNetworkConfig.wethTokenAddress != address(0)) {
            return activeNetworkConfig;
        }

        vm.startBroadcast();
        // TODO: Create mock contracts here:

        // MockV3Aggregator wethPriceFeed = new MockV3Aggregator(DECIMALS, ETH_USD_PRICE);
        // MockV3Aggregator wbtcPriceFeed = new MockV3Aggregator(DECIMALS, BTC_USD_PRICE);
        // ERC20Mock wethToken = new ERC20Mock("WETH", "WETH", msg.sender, 1000e8);
        // ERC20Mock wbtcToken = new ERC20Mock("WBTC", "WBTC", msg.sender, 1000e8);
        vm.stopBroadcast();

        return NetworkConfig({
            wethTokenAddress: address(0),
            virtualTokenAddress: address(0),
            bondingAddress: address(0),
            frouterAddress: address(0),
            deployerKey: ANVIL_PRIVATE_KEY
        });
    }
}
