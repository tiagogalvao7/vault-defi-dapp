const contractAddress = "YOUR_CONTRACT_ADDRESS";
const contractABI = "YOUR_CONTRACT_ABI";

document.addEventListener("DOMContentLoaded", () => {
  // get references of html elements
  // buttons and text

  const connectWalletButton = document.getElementById("connectWalletButton");
  const walletAddressText = document.getElementById("walletAddress");

  const depositEthButton = document.getElementById("depositButton");
  const withdrawEthButton = document.getElementById("withdrawButton");
  const depositEthInput = document.getElementById("depositAmount");
  const vaultBalanceText = document.getElementById("vaultBalance");

  const depositTokenButton = document.getElementById("depositTokenButton");
  const withdrawTokenButton = document.getElementById("withdrawTokenButton");

  let signer;
  let vaultContract;

  // ======= Helper function =======
  function requireContract() {
    if (!vaultContract) {
      alert("Please connect your wallet first");
      return false;
    }
    return true;
  }

  // add listener to event at button
  // ======= Connect Wallet =======
  connectWalletButton.addEventListener("click", async () => {
    // check if wallet extension (Metamask) is installed
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await ethereum.request({ method: "eth_requestAccounts" });

        signer = provider.getSigner();

        // Get wallet address
        const account = await signer.getAddress();
        document.getElementById("walletAddressInfo").value = account;

        // Get contract address and network values to put in info box
        document.getElementById("contractAddress").value = contractAddress;

        const network = await provider.getNetwork();
        document.getElementById(
          "network"
        ).value = `${network.name} (${network.chainId})`;

        // Create contract instance before any function
        vaultContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        // Update wallet address
        walletAddressText.textContent = `Wallet connected: ${account}`;
        console.log("Wallet connected:", account);

        // Get user balance and update value
        const balance = await vaultContract.getBalance(account);
        vaultBalanceText.textContent =
          ethers.utils.formatEther(balance) + " ETH";
      } catch (error) {
        console.error("Error connecting wallets", error);
        walletAddressText.textContent = "Connection error.";
      }
    } else {
      walletAddressText.textContent = "Please install Metamask to continue";
      console.log("Metamask not installed");
    }
  });

  // ======= Deposit ETH =======
  depositEthButton.addEventListener("click", async () => {
    if (!requireContract()) return;
    try {
      const userAddress = await signer.getAddress();
      const depositValue = depositEthInput.value;

      if (!depositValue) {
        alert("Please insert a valid ETH value");
        return;
      }

      const tx = await vaultContract.deposit({
        value: ethers.utils.parseEther(depositValue),
      });
      await tx.wait();
      const balance = await vaultContract.getBalance(userAddress);
      vaultBalanceText.textContent = ethers.utils.formatEther(balance) + " ETH";
    } catch (err) {
      console.error("Error deposit eth:", err);
    }
  });

  // ======= Withdraw ETH =======
  withdrawEthButton.addEventListener("click", async () => {
    try {
      const userAddress = await signer.getAddress();
      const withdrawValue = prompt("How many ETH you want to withdraw"); // caixa para input rápido

      if (!withdrawValue || isNaN(withdrawValue)) {
        alert("Please insert a valid ETH value.");
        return;
      }

      // Convert for Wei
      const withdrawWei = ethers.utils.parseEther(withdrawValue);

      // Make transaction
      const tx = await vaultContract.withdraw(withdrawWei);
      await tx.wait();

      // Update balance
      const balance = await vaultContract.getBalance(userAddress);
      vaultBalanceText.textContent = ethers.utils.formatEther(balance) + " ETH";

      alert(`You withdrew ${withdrawValue} ETH + acumulated interest`);
    } catch (err) {
      console.error("Error withdraw ETH:", err);
      alert("Erro ao levantar ETH");
    }
  });

  // ======= Tokens Box =======
  const tokenABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function decimals() view returns (uint8)",
  ];

  depositTokenButton.addEventListener("click", async () => {
    const tokenAddress = document.getElementById("tokenAddress").value;
    const amount = document.getElementById("tokenAmount").value;

    if (!tokenAddress || !amount) {
      alert("Please fill token address and amount");
      return;
    }

    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
    const decimals = await tokenContract.decimals();
    const amountWei = ethers.utils.parseUnits(amount, decimals);

    // Approve Vault to move tokens
    const approveTX = await tokenContract.approve(contractAddress, amountWei);
    await approveTX.wait();

    // Deposit tokens to Vault
    const tx = await vaultContract.depositToken(tokenAddress, amountWei);
    await tx.wait();

    alert("Tokens deposited");
    updateTokensBalance();
  });

  withdrawTokenButton.addEventListener("click", async () => {
    const tokenAddress = document.getElementById("tokenAddress").value;
    const amount = document.getElementById("tokenAmount").value;

    if (!tokenAddress || !amount) {
      alert("Please fill token address and amount");
      return;
    }

    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
    const decimals = await tokenContract.decimals();
    const amountWei = ethers.utils.parseUnits(amount, decimals);

    const tx = await vaultContract.withdrawTokens(tokenAddress, amountWei);
    await tx.wait();

    alert("Tokens withdrawn!");
    updateTokensBalance();
  });

  // update tokens balance function
  async function updateTokensBalance() {
    const tokenAddress = document.getElementById("tokenAddress").value;

    if (!tokenAddress) return;

    const balance = await vaultContract.getTokenBalance(
      tokenAddress,
      userAddress
    );
    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
    const decimals = await tokenContract.decimals();
    document.getElementById("tokenBalance").innerText =
      ethers.utils.formatUnits(balance, decimals);
  }
});
