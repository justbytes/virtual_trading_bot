// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {FRouter} from "../src/virt_contracts/FRouter.sol";
import {Bonding} from "../src/virt_contracts/Bonding.sol";
import {VirtualToken} from "../src/virt_contracts/Virtual.sol";

contract HelperConfig is Script {
    NetworkConfig public activeNetworkConfig;
    uint256 public constant ANVIL_PRIVATE_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    struct NetworkConfig {
        address virtualTokenAddress;
        address bondingAddress;
        address frouterAddress;
        uint256 deployerKey;
    }

    constructor() {
        activeNetworkConfig = getBaseMainnetConfig();
    }

    // constructor() {
    //     if (block.chainid == 8453) {
    //         activeNetworkConfig = getBaseMainnetConfig();
    //     } else {
    //         activeNetworkConfig = getOrCreateAnvilConfig();
    //     }
    // }

    function getBaseMainnetConfig() public view returns (NetworkConfig memory) {
        return NetworkConfig({
            virtualTokenAddress: 0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b,
            bondingAddress: 0xF66DeA7b3e897cD44A5a231c61B6B4423d613259,
            frouterAddress: 0x8292B43aB73EfAC11FAF357419C38ACF448202C5,
            deployerKey: vm.envUint("VIRT_KEY_ADDRESS")
        });
    }

    // function getOrCreateAnvilConfig() public view returns (NetworkConfig memory) {
    //     return NetworkConfig({
    //         virtualTokenAddress: 0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b,
    //         bondingAddress: 0xF66DeA7b3e897cD44A5a231c61B6B4423d613259,
    //         frouterAddress: 0x8292B43aB73EfAC11FAF357419C38ACF448202C5,
    //         deployerKey: vm.envUint("ANVIL_KEY_ADDRESS")
    //     });
    // }
}
