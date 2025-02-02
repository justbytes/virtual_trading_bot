// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {HelperConfig} from "./HelperConfig.s.sol";
import {Bonding} from "../test/mocks/Bonding.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BuyAgent is Script {
    HelperConfig public config;

    function run(address tokenAddress, uint256 amountIn) external {
        // Get the network config
        config = new HelperConfig();
        (, address virtualToken, address bondingAddress, address frouterAddress, uint256 deployerKey) =
            config.activeNetworkConfig();

        vm.startBroadcast(deployerKey);

        // Approve virtual token spending
        IERC20(virtualToken).approve(frouterAddress, amountIn);

        // Execute buy through bonding contract
        Bonding(bondingAddress).buy(amountIn, tokenAddress);

        vm.stopBroadcast();
    }
}
