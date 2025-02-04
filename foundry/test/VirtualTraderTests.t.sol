// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {DeployVirtualTrader} from "../script/DeployVirutalTrader.s.sol";
import {HelperConfig} from "../script/HelperConfig.s.sol";
import {VirtualTrader} from "../src/VirtualTrader.sol";
import {VirtualToken} from "../src/virt_contracts/Virtual.sol";
import {Bonding} from "../src/virt_contracts/Bonding.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

contract VirtualTraderTests is Test {
    DeployVirtualTrader public deployer;
    VirtualTrader public virtualTrader;
    HelperConfig public config;

    address public virtualToken;
    address public bondingAddress;
    address public frouterAddress;

    address public owner;
    address public user = makeAddr("user");

    // Test token on Base network
    address public constant TARRIF_TOKEN = 0xaa20A0CDc0830D267198dC3AC82519631A72272E;
    address public constant WETH_ADDRESS = 0x4200000000000000000000000000000000000006;
    uint256 public constant INITIAL_BALANCE = 100 ether;

    function setUp() public {
        // Deploy contracts
        deployer = new DeployVirtualTrader();
        (virtualTrader, config) = deployer.run();

        owner = virtualTrader.owner();

        (virtualToken, bondingAddress, frouterAddress,) = config.activeNetworkConfig();

        ERC20Mock(WETH_ADDRESS).mint(address(owner), INITIAL_BALANCE);
        // VirtualToken(virtualToken).mint(address(owner), INITIAL_BALANCE);
        deal(WETH_ADDRESS, owner, INITIAL_BALANCE);
        deal(virtualToken, owner, INITIAL_BALANCE);
        console2.log("Owner WETH balance:", IERC20(WETH_ADDRESS).balanceOf(owner));
        console2.log("Owner Virtual balance:", IERC20(virtualToken).balanceOf(owner));
    }

    // /////////////////
    // // Buy Function Tests
    // /////////////////

    function test_OnlyOwnerCanUseVirtualTraderBuy() public {
        vm.startPrank(user);
        vm.expectRevert(VirtualTrader.VirtualTrader__OnlyOwnerCanCallThisFunction.selector);
        virtualTrader.buy(TARRIF_TOKEN, 1 ether);
        vm.stopPrank();
    }

    // function test_VirtualTraderCanSwapVirtualTokenForPrototypeToken() public {
    //     uint256 amountIn = 10 ether;

    //     // First, user sends virtual tokens to the VirtualTrader contract
    //     vm.startPrank(owner);
    //     IERC20(virtualToken).transfer(address(virtualTrader), amountIn);
    //     IERC20(WETH_ADDRESS).transfer(address(virtualTrader), amountIn);
    //     vm.stopPrank();
    //     // Record initial balances
    //     uint256 initialTarrifBalance = virtualTrader.getBalance(TARRIF_TOKEN);
    //     uint256 initialVirtualBalance = virtualTrader.getBalance(virtualToken);
    //     uint256 initialWethBalance = virtualTrader.getBalance(WETH_ADDRESS);

    //     console2.log("VirtualTrader Tarrif balance:", initialTarrifBalance);
    //     console2.log("VirtualTrader Virtual balance:", initialVirtualBalance);
    //     console2.log("VirtualTrader WETH balance:", initialWethBalance);

    //     vm.startPrank(owner);
    //     virtualTrader.buy(TARRIF_TOKEN, amountIn);
    //     vm.stopPrank();

    //     // Verify balances changed
    //     assertTrue(IERC20(TARRIF_TOKEN).balanceOf(owner) > initialTarrifBalance, "Owner should receive Tarrif tokens");
    //     assertEq(virtualTrader.getBalance(virtualToken), 0, "Contract should have spent all Virtual tokens");
    // }

    // /////////////////
    // // Sell Function Tests
    // /////////////////

    // function test_SellOnlyOwner() public {
    //     vm.startPrank(user);
    //     vm.expectRevert();
    //     virtualTrader.sell(TARRIF_TOKEN, 1 ether);
    //     vm.stopPrank();
    // }

    // function test_SellSuccess() public {
    //     uint256 amountIn = 1 ether;

    //     // First buy some tokens to sell
    //     vm.startPrank(owner);
    //     IERC20(virtualToken).approve(address(virtualTrader), amountIn);
    //     virtualTrader.buy(TARRIF_TOKEN, amountIn);

    //     // Setup approvals for sell
    //     IERC20(TARRIF_TOKEN).approve(address(virtualTrader), amountIn);

    //     // Record initial balances
    //     uint256 initialTarrifBalance = IERC20(TARRIF_TOKEN).balanceOf(owner);
    //     uint256 initialVirtualBalance = IERC20(virtualToken).balanceOf(owner);

    //     // Execute sell
    //     virtualTrader.sell(TARRIF_TOKEN, amountIn);
    //     vm.stopPrank();

    //     // Verify balances changed
    //     assertTrue(IERC20(TARRIF_TOKEN).balanceOf(owner) < initialTarrifBalance);
    //     assertTrue(IERC20(virtualToken).balanceOf(owner) > initialVirtualBalance);
    // }
}
