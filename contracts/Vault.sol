// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Vault contract allows users to deposit ETH or ERC-20 tokens,
// withdraw funds including accrued interest, and track deposits with timestamps
contract Vault {
    using SafeERC20 for IERC20;

    // ETH balances per user
    mapping(address => uint256) private balances;
    
    // Timestamp of last ETH deposit per user
    mapping(address => uint256) private depositTimeStamps;
    
    // ERC-20 token balances per user (tokenAddress => user => amount)
    mapping(address => mapping(address => uint256)) private tokenBalances;

    // Total ETH deposited in contract
    uint256 public totalDeposits = 0;

    // DAILY INTEREST RATE (example: 1% daily = 100)
    uint256 public constant DAILY_RATE_PERCENT = 1;

    // EVENTS    
    event Deposit(address indexed _from, uint256 _value);
    event Withdraw(address indexed _from, uint256 _value);
    event TokenDeposit(address indexed _from, address indexed _token, uint256 _amount);
    event TokenWithdraw(address indexed _from, address indexed _token, uint256 _amount);

    // ===== DEPOSIT ETH =====
    function deposit() external payable {
        require(msg.value > 0, "Require a positive value");

        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;

        // Store timestamp for interest calculation
        depositTimeStamps[msg.sender] = block.timestamp;

        emit Deposit(msg.sender, msg.value);
    }

    // ===== WITHDRAW ETH WITH INTEREST =====
    function withdraw(uint256 _amount) external {
        require(balances[msg.sender] >= _amount, "Insufficient funds to withdraw");

        // Calculate interest
        uint256 interest = calculateInterest(msg.sender);
        uint256 totalAmount = _amount + interest;

        require(address(this).balance >= totalAmount, "Contract has insufficient funds");

        // Update balance
        balances[msg.sender] -= _amount;
        depositTimeStamps[msg.sender] = block.timestamp;

        // Transfer ETH to user
        (bool sent, ) = payable(msg.sender).call{ value: totalAmount }("");
        require(sent, "Failed to send ether");

        emit Withdraw(msg.sender, totalAmount);
    }

    // ===== GET ETH BALANCE =====
    function getBalance(address _address) external view returns (uint256) {
        return balances[_address];
    }

    // ===== GET ERC-20 TOKEN BALANCE =====
    function getTokenBalance(address _tokenAddress, address _user) external view returns (uint256) {
        return tokenBalances[_tokenAddress][_user];
    }

    // ===== DEPOSIT ERC-20 TOKEN =====
    function depositToken(address _tokenAddress, uint256 _amount) external {
        require(_amount > 0, "Require a positive amount");

        IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _amount);

        tokenBalances[_tokenAddress][msg.sender] += _amount;

        emit TokenDeposit(msg.sender, _tokenAddress, _amount);
    }

    // ===== WITHDRAW ERC-20 TOKEN =====
    function withdrawTokens(address _tokenAddress, uint256 _amount) external {
        require(tokenBalances[_tokenAddress][msg.sender] >= _amount, "Insufficient token balance");

        tokenBalances[_tokenAddress][msg.sender] -= _amount;

        IERC20(_tokenAddress).safeTransfer(msg.sender, _amount);

        emit TokenWithdraw(msg.sender, _tokenAddress, _amount);
    }

    // ===== CALCULATE ETH INTEREST =====
    function calculateInterest(address _user) public view returns (uint256) {
        uint256 timeElapsed = block.timestamp - depositTimeStamps[_user];
        uint256 daysElapsed = timeElapsed / 1 days;
        uint256 interest = (balances[_user] * DAILY_RATE_PERCENT * daysElapsed) / 100;
        return interest;
    }
}
