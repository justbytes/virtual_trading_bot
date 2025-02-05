// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Bonding} from "./virt_contracts/Bonding.sol";

contract VirtualTrader {
    error VirtualTrader__OnlyOwnerCanCallThisFunction();
    error VirtualTrader__WithdrawTransferFailed();
    error VirtualTrader__WithdrawTokenTransferFailed();

    uint256 private constant MIN_VIRTUAL_BALANCE = 50 ether;
    address private bondingAddress;
    address private frouterAddress;
    address private virtualToken;

    address public owner;

    constructor(address _bondingAddress, address _frouterAddress, address _virtualToken) {
        owner = msg.sender;
        bondingAddress = _bondingAddress;
        frouterAddress = _frouterAddress;
        virtualToken = _virtualToken;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert VirtualTrader__OnlyOwnerCanCallThisFunction();
        }
        _;
    }

    function buy(address tokenAddress, uint256 amountIn) external onlyOwner {
        // Approve virtual token spending with a higher amount to account for potential fees
        IERC20(virtualToken).approve(frouterAddress, amountIn);

        // Execute buy through bonding contract
        Bonding(bondingAddress).buy(amountIn, tokenAddress);
    }

    function sell(address tokenAddress, uint256 amountIn) external onlyOwner {
        // Approve the bonding contract to spend our token
        IERC20(tokenAddress).approve(frouterAddress, amountIn);

        // Execute sell through bonding contract
        Bonding(bondingAddress).sell(amountIn, tokenAddress);

        // Check if the virtual balance is above the minimum threshold then send the extra to the owner
        if (getBalance(virtualToken) > MIN_VIRTUAL_BALANCE) {
            withdrawToken(virtualToken, getBalance(virtualToken) - MIN_VIRTUAL_BALANCE);
        }
    }

    // For withdrawing native ETH/BASE
    function withdraw() public payable onlyOwner {
        (bool success,) = payable(owner).call{value: address(this).balance}("");
        if (!success) revert VirtualTrader__WithdrawTransferFailed();
    }

    // For withdrawing specific ERC20 tokens
    function withdrawToken(address token, uint256 amount) public onlyOwner {
        bool success = IERC20(token).transfer(payable(owner), amount);
        if (!success) revert VirtualTrader__WithdrawTokenTransferFailed();
    }

    // Helper view function to check balances
    function getBalance(address token) public view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}
