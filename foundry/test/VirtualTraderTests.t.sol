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
        deployer = new DeployVirtualTrader();
        (virtualTrader, config) = deployer.run();

        owner = virtualTrader.owner();

        (virtualToken, bondingAddress, frouterAddress,) = config.activeNetworkConfig();

        ERC20Mock(WETH_ADDRESS).mint(address(owner), INITIAL_BALANCE);

        deal(WETH_ADDRESS, owner, INITIAL_BALANCE);
        deal(virtualToken, owner, INITIAL_BALANCE);
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

    modifier fundContract() {
        vm.startPrank(owner);
        IERC20(virtualToken).transfer(address(virtualTrader), 10 ether);
        IERC20(WETH_ADDRESS).transfer(address(virtualTrader), 10 ether);
        vm.stopPrank();

        uint256 initialVirtualBalance = virtualTrader.getBalance(virtualToken);
        uint256 initialWethBalance = virtualTrader.getBalance(WETH_ADDRESS);

        _;
    }

    function test_VirtualTraderCanBuyPrototypeToken() public fundContract {
        uint256 amountIn = 1 ether;

        // Record initial balances
        uint256 initialTarrifBalance = virtualTrader.getBalance(TARRIF_TOKEN);

        console2.log("VirtualTrader Tarrif balance:", initialTarrifBalance);

        vm.startPrank(owner);
        IERC20(virtualToken).approve(address(virtualTrader), amountIn);
        virtualTrader.buy(TARRIF_TOKEN, amountIn);
        vm.stopPrank();
        // Verify balances changed
        assert(virtualTrader.getBalance(TARRIF_TOKEN) > initialTarrifBalance);
        console2.log("VirtualTrader Tarrif balance:", virtualTrader.getBalance(TARRIF_TOKEN));
    }

    // /////////////////
    // // Sell Function Tests
    // /////////////////

    function test_OnlyOwnerCanUseVirtualTraderSell() public {
        vm.startPrank(user);
        vm.expectRevert(VirtualTrader.VirtualTrader__OnlyOwnerCanCallThisFunction.selector);
        virtualTrader.sell(TARRIF_TOKEN, 1 ether);
        vm.stopPrank();
    }

    function test_VirtualTraderCanSellPrototypeTokenWithoutVirtualTokenWithdraw() public fundContract {
        uint256 virtualTokenIn = 1 ether;

        vm.startPrank(owner);
        IERC20(virtualToken).approve(address(virtualTrader), virtualTokenIn);
        virtualTrader.buy(TARRIF_TOKEN, virtualTokenIn);
        uint256 virtualBalanceAfterBuy = virtualTrader.getBalance(virtualToken);
        uint256 tarrifBalance = virtualTrader.getBalance(TARRIF_TOKEN);
        virtualTrader.sell(TARRIF_TOKEN, tarrifBalance);
        vm.stopPrank();

        assert(virtualTrader.getBalance(TARRIF_TOKEN) == 0);
        assert(virtualTrader.getBalance(virtualToken) > virtualBalanceAfterBuy);
    }

    function test_VirtualTraderCanSellPrototypeTokenAndWithdrawExtraVirtualToken() public {
        vm.startPrank(owner);

        IERC20(virtualToken).transfer(address(virtualTrader), 55 ether);
        IERC20(WETH_ADDRESS).transfer(address(virtualTrader), 10 ether);
        vm.stopPrank();

        uint256 virtualTokenIn = 1 ether;
        uint256 initialVirtualBalance = IERC20(virtualToken).balanceOf(owner);

        vm.startPrank(owner);
        IERC20(virtualToken).approve(address(virtualTrader), virtualTokenIn);
        virtualTrader.buy(TARRIF_TOKEN, virtualTokenIn);

        uint256 tarrifBalance = virtualTrader.getBalance(TARRIF_TOKEN);
        virtualTrader.sell(TARRIF_TOKEN, tarrifBalance);
        vm.stopPrank();

        assert(virtualTrader.getBalance(TARRIF_TOKEN) == 0);
        assert(virtualTrader.getBalance(virtualToken) <= 50 ether);
        assert(IERC20(virtualToken).balanceOf(owner) > initialVirtualBalance);
    }

    function test_WithdrawNativeToken() public {
        // Fund contract with native token (ETH/BASE)
        vm.deal(address(virtualTrader), 1 ether);
        uint256 initialOwnerBalance = owner.balance;

        vm.prank(owner);
        virtualTrader.withdraw();

        assertEq(address(virtualTrader).balance, 0);
        assertEq(owner.balance, initialOwnerBalance + 1 ether);
    }

    function test_OnlyOwnerCanWithdrawNativeToken() public {
        vm.deal(address(virtualTrader), 1 ether);

        vm.prank(user);
        vm.expectRevert(VirtualTrader.VirtualTrader__OnlyOwnerCanCallThisFunction.selector);
        virtualTrader.withdraw();
    }

    function test_WithdrawSpecificToken() public {
        // Fund contract with some ERC20 token
        vm.startPrank(owner);
        IERC20(WETH_ADDRESS).transfer(address(virtualTrader), 1 ether);

        uint256 initialOwnerBalance = IERC20(WETH_ADDRESS).balanceOf(owner);
        //uint256 initialContractBalance = virtualTrader.getBalance(WETH_ADDRESS);

        virtualTrader.withdrawToken(WETH_ADDRESS, 1 ether);
        vm.stopPrank();

        assertEq(virtualTrader.getBalance(WETH_ADDRESS), 0);
        assertEq(IERC20(WETH_ADDRESS).balanceOf(owner), initialOwnerBalance + 1 ether);
    }

    function test_OnlyOwnerCanWithdrawTokens() public {
        vm.prank(user);
        vm.expectRevert(VirtualTrader.VirtualTrader__OnlyOwnerCanCallThisFunction.selector);
        virtualTrader.withdrawToken(WETH_ADDRESS, 1 ether);
    }
}
