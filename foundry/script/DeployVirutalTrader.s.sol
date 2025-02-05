// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {VirtualTrader} from "../src/VirtualTrader.sol";
import {HelperConfig} from "./HelperConfig.s.sol";

contract DeployVirtualTrader is Script {
    HelperConfig public config;
    VirtualTrader public virtualTrader;

    function run() external returns (VirtualTrader, HelperConfig) {
        // Get the network config
        config = new HelperConfig();
        (address virtualToken, address bondingAddress, address frouterAddress,) = config.activeNetworkConfig();

        vm.startBroadcast();
        virtualTrader = new VirtualTrader(bondingAddress, frouterAddress, virtualToken);
        vm.stopBroadcast();
        return (virtualTrader, config);
    }
}
