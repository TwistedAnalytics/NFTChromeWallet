import { ethers } from 'ethers';

/**
 * Provider cache
 */
const providerCache = new Map<string, ethers.JsonRpcProvider>();

/**
 * Get or create a cached provider
 */
export function getProvider(rpcUrl: string): ethers.JsonRpcProvider {
  let provider = providerCache.get(rpcUrl);

  if (!provider) {
    provider = new ethers.JsonRpcProvider(rpcUrl);
    providerCache.set(rpcUrl, provider);
  }

  return provider;
}

/**
 * Clear provider cache
 */
export function clearProviderCache(): void {
  providerCache.clear();
}

/**
 * Get provider for network
 */
export function getNetworkProvider(networkId: string, networks: any[]): ethers.JsonRpcProvider {
  const network = networks.find(n => n.id === networkId);
  if (!network) {
    throw new Error(`Network ${networkId} not found`);
  }
  return getProvider(network.rpcUrl);
}
