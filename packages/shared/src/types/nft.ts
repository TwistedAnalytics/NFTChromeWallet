/**
 * NFT attribute
 */
export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

/**
 * NFT collection metadata
 */
export interface NFTCollection {
  name?: string;
  family?: string;
  symbol?: string;
}

/**
 * Normalized NFT representation across chains
 */
export interface NormalizedNFT {
  chain: 'ethereum' | 'solana';
  contractAddress: string;
  tokenId: string;
  name?: string;
  description?: string;
  image?: string;
  animationUrl?: string;
  externalUrl?: string;
  attributes?: NFTAttribute[];
  collection?: NFTCollection;
  owner: string;
  standard: 'ERC721' | 'ERC1155' | 'Metaplex';
  balance?: number;
  isSpam?: boolean;
  isFlagged?: boolean;
  metadata?: any;
}

/**
 * NFT metadata (raw)
 */
export interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  animation_url?: string;
  external_url?: string;
  attributes?: NFTAttribute[];
  properties?: any;
  [key: string]: any;
}

/**
 * NFT attribute
 */
export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

/**
 * NFT collection metadata
 */
export interface NFTCollection {
  name?: string;
  family?: string;
  symbol?: string;
}

/**
 * Normalized NFT representation across chains
 */
export interface NormalizedNFT {
  chain: 'ethereum' | 'solana';
  contractAddress: string;
  tokenId: string;
  name?: string;
  description?: string;
  image?: string;
  animationUrl?: string;
  externalUrl?: string;
  attributes?: NFTAttribute[];
  collection?: NFTCollection;
  owner: string;
  standard: 'ERC721' | 'ERC1155' | 'Metaplex';
  balance?: number;
  isSpam?: boolean;
  isFlagged?: boolean;
  metadata?: any;
}

/**
 * NFT metadata (raw)
 */
export interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  animation_url?: string;
  external_url?: string;
  attributes?: NFTAttribute[];
  properties?: any;
  [key: string]: any;
}

// Add NFT alias for UI components
export interface NFT {
  id: string;
  chain: 'ethereum' | 'solana';
  tokenId: string;
  mint?: string;
  contract: {
    address: string;
    name?: string;
    tokenType?: string;
  };
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
    symbol?: string;
    external_url?: string;
    animation_url?: string;
  };
  balance?: number;
  ownership?: {
    owner: string;
    frozen?: boolean;
    delegated?: boolean;
  };
  creators?: any[];
  royalty?: any;
  compression?: any;
  grouping?: Array<{
    group_key: string;
    group_value: string;
  }>;
  interface?: string;
  raw?: any;
}
