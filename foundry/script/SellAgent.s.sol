pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {HelperConfig} from "./HelperConfig.s.sol";
import {Bonding} from "../test/mocks/Bonding.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SellAgent is Script {
    HelperConfig public config;

    function run(address tokenAddress, uint256 amountIn) external {
        // Get the network config
        config = new HelperConfig();
        (,, address bondingAddress, address frouterAddress, uint256 deployerKey) = config.activeNetworkConfig();

        vm.startBroadcast(deployerKey);

        // Approve the bonding contract to spend our token
        IERC20(tokenAddress).approve(frouterAddress, amountIn);

        // Execute sell through bonding contract
        Bonding(bondingAddress).sell(amountIn, tokenAddress);

        vm.stopBroadcast();
    }
}
