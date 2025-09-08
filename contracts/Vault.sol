// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Vault contract allows users to deposit ETH or ERC-20 tokens, withdraw funds, and track deposits with timestamps for potential interest calculation
contract Vault {

    // MAPPINGS    
    // ETH balances per user
    mapping(address => uint256) private balances;
    
    // Timestamp of last ETH deposit per user
    mapping(address => uint256) private depositTimeStamps;
    
    // ERC-20 token balances per user (tokenAddress => user => amount)
    mapping(address => mapping(address => uint256)) private tokenBalances;

    // Total ETH deposited in contract
    uint256 public totalDeposits = 0;

    // EVENTS    
    event Deposit(address indexed _from, uint256 _value);
    event Withdraw(address indexed _from, uint256 _value);
    event TokenDeposit(address indexed _from, address indexed _token, uint256 _amount);
    event TokenWithdraw(address indexed _from, address indexed _token, uint256 _amount);

    // DEPOSIT ETH    
    function deposit() external payable {
        require(msg.value > 0, "Require a positive value");
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;

        // Store timestamp for interest calculation
        depositTimeStamps[msg.sender] = block.timestamp;
        
        emit Deposit(msg.sender, msg.value);
    }

    // WITHDRAW ETH    
    function withdraw(uint256 _amount) external {
        require(balances[msg.sender] >= _amount, "Insufficient funds to withdraw");
        balances[msg.sender] -= _amount;

        // Transfer ETH to user
        (bool sent, ) = payable(msg.sender).call{ value: _amount }("");
        require(sent, "Failed to send ether");

        emit Withdraw(msg.sender, _amount);
    }

    // Returns ETH balance of a user
    function getBalance(address _address) external view returns (uint256) {
        return balances[_address];
    }

    // Returns ERC-20 token balance of a user
    function getTokenBalance(address _tokenAddress, address _user) external view returns (uint256) {
        return tokenBalances[_tokenAddress][_user];
    }

    // DEPOSIT ERC-20 TOKEN
    function depositToken(address _tokenAddress, uint256 _amount) external {
        require(_amount > 0, "Require a positive amount");

        // Transfer tokens from user to contract
        bool success = IERC20(_tokenAddress).transferFrom(msg.sender, address(this), _amount);
        require(success, "Token transfer failed");

        // Update token balance mapping
        tokenBalances[_tokenAddress][msg.sender] += _amount;

        emit TokenDeposit(msg.sender, _tokenAddress, _amount);
    }

    // WITHDRAW ERC-20 TOKEN
    function withdrawTokens(address _tokenAddress, uint256 _amount) external {
        require(tokenBalances[_tokenAddress][msg.sender] >= _amount, "Insufficient token balance");

        tokenBalances[_tokenAddress][msg.sender] -= _amount;

        // Transfer tokens back to user
        bool success = IERC20(_tokenAddress).transfer(msg.sender, _amount);
        require(success, "Token transfer failed");

        emit TokenWithdraw(msg.sender, _tokenAddress, _amount);
    }

    // Calculates simple interest based on time elapsed
    function calculateInterest(address _user, uint256 _ratePerYear) external view returns (uint256) {
        uint256 timeElapsed = block.timestamp - depositTimeStamps[_user];
        uint256 interest = balances[_user] * _ratePerYear * timeElapsed / (100 * 365 days);
        return interest;
    }
}
