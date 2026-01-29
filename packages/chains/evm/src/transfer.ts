import { ethers } from 'ethers';
import type { ethers as EthersTypes } from 'ethers';
import type { NormalizedNFT } from '@nft-wallet/shared';

/**
 * Build ERC-721 transfer transaction
 */
export async function buildERC721Transfer(
  contractAddress: string,
  from: string,
  to: string,
  tokenId: string,
  provider: EthersTypes.Provider
): Promise<any> {
  const abi = ['function safeTransferFrom(address from, address to, uint256 tokenId)'];
  const contract = new ethers.Contract(contractAddress, abi, provider);

  const data = contract.interface.encodeFunctionData('safeTransferFrom', [from, to, tokenId]);

  // Estimate gas
  const gasEstimate = await provider.estimateGas({
    from,
    to: contractAddress,
    data,
  });

  return {
    from,
    to: contractAddress,
    data,
    gasLimit: gasEstimate.toString(),
  };
}

/**
 * Build ERC-1155 transfer transaction
 */
export async function buildERC1155Transfer(
  contractAddress: string,
  from: string,
  to: string,
  tokenId: string,
  amount: number,
  provider: EthersTypes.Provider
): Promise<any> {
  const abi = ['function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)'];
  const contract = new ethers.Contract(contractAddress, abi, provider);

  const data = contract.interface.encodeFunctionData('safeTransferFrom', [
    from,
    to,
    tokenId,
    amount,
    '0x', // empty data
  ]);

  // Estimate gas
  const gasEstimate = await provider.estimateGas({
    from,
    to: contractAddress,
    data,
  });

  return {
    from,
    to: contractAddress,
    data,
    gasLimit: gasEstimate.toString(),
  };
}

/**
 * Build NFT transfer transaction based on standard
 */
export async function buildNFTTransfer(
  nft: NormalizedNFT,
  from: string,
  to: string,
  amount: number = 1,
  provider: EthersTypes.Provider
): Promise<any> {
  if (nft.standard === 'ERC721') {
    return buildERC721Transfer(nft.contractAddress, from, to, nft.tokenId, provider);
  } else if (nft.standard === 'ERC1155') {
    return buildERC1155Transfer(nft.contractAddress, from, to, nft.tokenId, amount, provider);
  } else {
    throw new Error(`Unsupported NFT standard: ${nft.standard}`);
  }
}
