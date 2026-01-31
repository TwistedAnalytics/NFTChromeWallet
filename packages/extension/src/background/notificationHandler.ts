interface BalanceCache {
  solBalance: string;
  ethBalance: string;
  lastChecked: number;
}

interface NFTCache {
  nftCount: number;
  lastChecked: number;
}

const CACHE_KEYS = {
  BALANCE_CACHE: 'balanceCache',
  NFT_COUNT_CACHE: 'nftCountCache',
};

/**
 * Check for balance changes and notify
 */
export async function checkBalanceChanges(
  solBalance: string,
  ethBalance: string,
  solAddress: string,
  ethAddress: string
): Promise<void> {
  const result = await chrome.storage.local.get([CACHE_KEYS.BALANCE_CACHE]);
  const cached: BalanceCache | undefined = result[CACHE_KEYS.BALANCE_CACHE];

  if (cached) {
    const solChanged = parseFloat(solBalance) > parseFloat(cached.solBalance);
    const ethChanged = parseFloat(ethBalance) > parseFloat(cached.ethBalance);

    if (solChanged) {
      const amount = (parseFloat(solBalance) - parseFloat(cached.solBalance)).toFixed(9);
      await showNotification(
        'SOL Received! 🎉',
        `+${amount} SOL received\nAddress: ${solAddress.slice(0, 6)}...${solAddress.slice(-4)}`
      );
    }

    if (ethChanged) {
      const amount = (parseFloat(ethBalance) - parseFloat(cached.ethBalance)).toFixed(9);
      await showNotification(
        'ETH Received! 🎉',
        `+${amount} ETH received\nAddress: ${ethAddress.slice(0, 6)}...${ethAddress.slice(-4)}`
      );
    }
  }

  // Update cache
  await chrome.storage.local.set({
    [CACHE_KEYS.BALANCE_CACHE]: {
      solBalance,
      ethBalance,
      lastChecked: Date.now(),
    } as BalanceCache,
  });
}

/**
 * Check for new NFTs and notify
 */
export async function checkNFTChanges(nftCount: number): Promise<void> {
  const result = await chrome.storage.local.get([CACHE_KEYS.NFT_COUNT_CACHE]);
  const cached: NFTCache | undefined = result[CACHE_KEYS.NFT_COUNT_CACHE];

  if (cached && nftCount > cached.nftCount) {
    const newNFTs = nftCount - cached.nftCount;
    await showNotification(
      'New NFT! 🖼️',
      `You received ${newNFTs} new NFT${newNFTs > 1 ? 's' : ''}!`
    );
  }

  // Update cache
  await chrome.storage.local.set({
    [CACHE_KEYS.NFT_COUNT_CACHE]: {
      nftCount,
      lastChecked: Date.now(),
    } as NFTCache,
  });
}

/**
 * Show Chrome notification
 */
async function showNotification(title: string, message: string): Promise<void> {
  try {
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icon-128.png'),
      title,
      message,
      priority: 2,
    });
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
}

/**
 * Start periodic balance checking (every 30 seconds)
 */
export function startBalanceMonitoring(
  getBalanceFunc: () => Promise<{ solBalance: string; ethBalance: string; solAddress: string; ethAddress: string }>
): void {
  // Check immediately
  getBalanceFunc().then(({ solBalance, ethBalance, solAddress, ethAddress }) => {
    checkBalanceChanges(solBalance, ethBalance, solAddress, ethAddress);
  });

  // Set up periodic checking
  chrome.alarms.create('balanceCheck', { periodInMinutes: 0.5 }); // Every 30 seconds

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'balanceCheck') {
      getBalanceFunc().then(({ solBalance, ethBalance, solAddress, ethAddress }) => {
        checkBalanceChanges(solBalance, ethBalance, solAddress, ethAddress);
      });
    }
  });
}
