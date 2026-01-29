import type { NormalizedNFT, NFTMetadata } from '@nft-wallet/shared';
import { resolveIPFS } from '@nft-wallet/shared';

/**
 * Spam detection keywords
 */
const SPAM_KEYWORDS = [
  'airdrop',
  'claim',
  'free',
  'reward',
  'bonus',
  'gift',
  'prize',
  'winner',
  'mint now',
  'visit',
  'click here',
];

/**
 * Normalize ERC-721 NFT
 */
export function normalizeERC721(
  contractAddress: string,
  tokenId: string,
  metadata: NFTMetadata | null,
  owner: string,
  ipfsGateway: string = 'cloudflare-ipfs.com'
): NormalizedNFT {
  const nft: NormalizedNFT = {
    chain: 'ethereum',
    contractAddress,
    tokenId,
    owner,
    standard: 'ERC721',
    metadata,
  };

  if (metadata) {
    nft.name = metadata.name;
    nft.description = metadata.description;
    nft.image = resolveIPFS(metadata.image || '', ipfsGateway);
    nft.animationUrl = metadata.animation_url ? resolveIPFS(metadata.animation_url, ipfsGateway) : undefined;
    nft.externalUrl = metadata.external_url;
    nft.attributes = metadata.attributes;
    nft.collection = metadata.collection;
  }

  nft.isSpam = detectSpam(nft);

  return nft;
}

/**
 * Normalize ERC-1155 NFT
 */
export function normalizeERC1155(
  contractAddress: string,
  tokenId: string,
  metadata: NFTMetadata | null,
  owner: string,
  balance: number,
  ipfsGateway: string = 'cloudflare-ipfs.com'
): NormalizedNFT {
  const nft = normalizeERC721(contractAddress, tokenId, metadata, owner, ipfsGateway);
  nft.standard = 'ERC1155';
  nft.balance = balance;
  return nft;
}

/**
 * Normalize Metaplex NFT (Solana)
 */
export function normalizeMetaplex(
  mintAddress: string,
  metadata: any,
  owner: string,
  ipfsGateway: string = 'cloudflare-ipfs.com'
): NormalizedNFT {
  const nft: NormalizedNFT = {
    chain: 'solana',
    contractAddress: mintAddress,
    tokenId: '0',
    owner,
    standard: 'Metaplex',
    metadata,
  };

  if (metadata) {
    nft.name = metadata.name;
    nft.description = metadata.description;
    nft.image = resolveIPFS(metadata.image || '', ipfsGateway);
    nft.animationUrl = metadata.animation_url ? resolveIPFS(metadata.animation_url, ipfsGateway) : undefined;
    nft.externalUrl = metadata.external_url;
    nft.attributes = metadata.attributes;
    nft.collection = metadata.collection;
  }

  nft.isSpam = detectSpam(nft);

  return nft;
}

/**
 * Detect spam NFT
 */
export function detectSpam(nft: NormalizedNFT): boolean {
  const textToCheck = [
    nft.name || '',
    nft.description || '',
    nft.collection?.name || '',
  ].join(' ').toLowerCase();

  return SPAM_KEYWORDS.some(keyword => textToCheck.includes(keyword.toLowerCase()));
}

/**
 * Generate Magic Eden link for NFT
 */
export function getMagicEdenLink(nft: NormalizedNFT): string | null {
  if (nft.chain === 'ethereum') {
    return `https://magiceden.io/item-details/ethereum/${nft.contractAddress}/${nft.tokenId}`;
  } else if (nft.chain === 'solana') {
    return `https://magiceden.io/item-details/${nft.contractAddress}`;
  }
  return null;
}
