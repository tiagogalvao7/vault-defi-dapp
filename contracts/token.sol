// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Mock DAI Token only for tests
contract MockDAI is ERC20, Ownable {
    constructor() ERC20("Mock DAI", "mDAI") Ownable(msg.sender) {
        // Start mint for deployer (1000 mDAI)
        _mint(msg.sender, 1000 * 10 ** decimals());
    }

    // Function for owner mint
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
