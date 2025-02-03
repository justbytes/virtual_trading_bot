pragma solidity ^0.8.20;

// SPDX-License-Identifier: MIT

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract VirtualToken is ERC20Capped, Ownable {
    constructor(uint256 _initialSupply, address initialOwner)
        ERC20("Virtual Protocol", "VIRTUAL")
        ERC20Capped(1000000000 * 10 ** 18)
        Ownable(initialOwner)
    {
        ERC20._mint(msg.sender, _initialSupply);
    }

    function mint(address _to, uint256 _amount) external onlyOwner {
        _mint(_to, _amount);
    }
}
