import { ethers } from 'ethers';
import type { ethers as EthersTypes } from 'ethers';

/**
 * ERC-1155 ABI (minimal)
 */
const ERC1155_ABI = [
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
  'function uri(uint256 id) view returns (string)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
];

/**
 * ERC-1155 interface ID
 */
const ERC1155_INTERFACE_ID = '0xd9b67a26';

/**
 * Check if contract supports ERC-1155
 */
export async function isERC1155(
  contractAddress: string,
  provider: EthersTypes.Provider
): Promise<boolean> {
  try {
    const contract = new ethers.Contract(contractAddress, ERC1155_ABI, provider);
    return await contract.supportsInterface(ERC1155_INTERFACE_ID);
  } catch (error) {
    return false;
  }
}

/**
 * Get ERC-1155 balance for specific token
 */
export async function getBalance(
  contractAddress: string,
  owner: string,
  tokenId: string,
  provider: EthersTypes.Provider
): Promise<number> {
  const contract = new ethers.Contract(contractAddress, ERC1155_ABI, provider);
  const balance = await contract.balanceOf(owner, tokenId);
  return Number(balance);
}

/**
 * Get token URI
 */
export async function getURI(
  contractAddress: string,
  tokenId: string,
  provider: EthersTypes.Provider
): Promise<string> {
  const contract = new ethers.Contract(contractAddress, ERC1155_ABI, provider);
  return await contract.uri(tokenId);
}

/**
 * Fetch all ERC-1155 NFTs for an owner
 * Note: This is a simplified implementation. In production, you'd use an indexer/API
 */
export async function fetchNFTs(
  contractAddress: string,
  owner: string,
  provider: EthersTypes.Provider
): Promise<Array<{ tokenId: string; uri: string; balance: number }>> {
  // In production, this would query events or use an API like Alchemy/Moralis
  // For now, return empty array
  return [];
}
