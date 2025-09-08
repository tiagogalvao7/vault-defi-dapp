import { expect } from "chai";
import { network } from "hardhat";
// import { IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.sol"; // ou define o tipo manualmente


const { ethers } = await network.connect();

describe("Vault", function () {
  
  // Test 1: Deposit/Get ETH
  it("Should be possible deposit and get ETH", async function () {
    const [owner] = await ethers.getSigners();
    const instance = await ethers.deployContract("Vault");

    // Deposit 1ETH
    const tx = await instance.deposit({ value: ethers.parseEther("1") });
    await tx.wait();

    // Check  user balance of the contract
    const balance = await instance.getBalance(owner.address);
    expect(balance).to.equal(ethers.parseEther("1"));

    // Check contract balance
    const contractBalance = await ethers.provider.getBalance(instance.getAddress());
    expect(contractBalance).to.equal(ethers.parseEther("1"));

  });

  /*
  // Test 2: Deposit/Get ERC-20
  it("Should deposit and withdraw ERC-20 tokens", async function () {
    const [owner] = await ethers.getSigners();
    const instance = await ethers.deployContract("Vault");

    // Deploy TestToken com 1000 TTK
    const Token = await ethers.getContractFactory("ERC20PresetMinterPauser");
    const token: any = await Token.deploy("MyToken", "MTK"); // 'any' para TS
    await token.waitForDeployment();

    // Mint 1000 tokens for the owner
    await token.mint(owner.address, ethers.parseEther("1000"));

    // Approve Vault to spend 100 tokens from owner
    await token.connect(owner).approve(await instance.getAddress(), ethers.parseEther("100"));

    // Deposit 100 TTK no Vault
    await instance.depositToken(await token.getAddress(), ethers.parseEther("100"));

    // Check balance in Vault
    const balanceInVault = await instance.getTokenBalance(await token.getAddress(), owner.address);
    expect(balanceInVault).to.equal(ethers.parseEther("100"));

    // Withdraw 40 TTK
    await instance.withdrawTokens(await token.getAddress(), ethers.parseEther("40"));

    // Check balance after withdraw
    const finalBalanceVault = await instance.getTokenBalance(await token.getAddress(), owner.address);
    expect(finalBalanceVault).to.equal(ethers.parseEther("60"));

    const finalBalanceWallet = await token.balanceOf(owner.address);
    expect(finalBalanceWallet).to.equal(ethers.parseEther("940"));
  });
  */

  // Test 3: Timestamps and interests
  it("Should calculate interest correctly after time passes", async function () {
    
    const [owner] = await ethers.getSigners();
    const instance = await ethers.deployContract("Vault");

    // Deposit 1 ETH
    const tx = await instance.deposit({ value: ethers.parseEther("1") });

    // Simulate 1 year
    const oneYear = 365 * 24 * 60 * 60;
    await ethers.provider.send("evm_increaseTime", [oneYear]);
    await ethers.provider.send("evm_mine", []) // mines a block to apply time

    const interest = await instance.calculateInterest(owner.address, 10);

    expect(interest).to.equal(ethers.parseEther("0.1"));
  });

  // Test 4: Events
  it("Should emit correct events", async function () {
    const [owner] = await ethers.getSigners();
    const instance = await ethers.deployContract("Vault");

    // --  Test ETH Deposit --
    await expect(instance.deposit({ value: ethers.parseEther("1") })).to.emit(instance, "Deposit").withArgs(owner.address, ethers.parseEther("1"));

    // -- Test ETH Withdraw --
    await expect(instance.withdraw(ethers.parseEther("0.5"))).to.emit(instance, "Withdraw").withArgs(owner.address, ethers.parseEther("0.5"));
  });
});
