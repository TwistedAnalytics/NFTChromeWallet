import { ethers } from 'ethers';
import type { ethers as EthersTypes } from 'ethers';

/**
 * ERC-721 ABI (minimal)
 */
const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
];

/**
 * ERC-721 interface ID
 */
const ERC721_INTERFACE_ID = '0x80ac58cd';

/**
 * Check if contract supports ERC-721
 */
export async function isERC721(
  contractAddress: string,
  provider: EthersTypes.Provider
): Promise<boolean> {
  try {
    const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
    return await contract.supportsInterface(ERC721_INTERFACE_ID);
  } catch (error) {
    return false;
  }
}

/**
 * Get ERC-721 balance
 */
export async function getBalance(
  contractAddress: string,
  owner: string,
  provider: EthersTypes.Provider
): Promise<number> {
  const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
  const balance = await contract.balanceOf(owner);
  return Number(balance);
}

/**
 * Get token URI
 */
export async function getTokenURI(
  contractAddress: string,
  tokenId: string,
  provider: EthersTypes.Provider
): Promise<string> {
  const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
  return await contract.tokenURI(tokenId);
}

/**
 * Get owner of token
 */
export async function getOwner(
  contractAddress: string,
  tokenId: string,
  provider: EthersTypes.Provider
): Promise<string> {
  const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
  return await contract.ownerOf(tokenId);
}

/**
 * Fetch all ERC-721 NFTs for an owner
 * Note: This is a simplified implementation. In production, you'd use an indexer/API
 */
export async function fetchNFTs(
  contractAddress: string,
  owner: string,
  provider: EthersTypes.Provider
): Promise<Array<{ tokenId: string; tokenURI: string }>> {
  // In production, this would query events or use an API like Alchemy/Moralis
  // For now, return empty array
  return [];
}
