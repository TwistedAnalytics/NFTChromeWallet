import { describe, it, expect } from 'vitest';
import {
  normalizeERC721,
  normalizeERC1155,
  normalizeMetaplex,
  detectSpam,
  getMagicEdenLink,
} from '../packages/core/src/nft/normalizer.js';
import type { NFTMetadata } from '@nft-wallet/shared';

describe('NFT Normalizer', () => {
  const mockMetadata: NFTMetadata = {
    name: 'Test NFT',
    description: 'A test NFT',
    image: 'ipfs://QmTest123',
    attributes: [
      { trait_type: 'Background', value: 'Blue' },
      { trait_type: 'Rarity', value: 'Common' },
    ],
  };

  describe('ERC-721 Normalization', () => {
    it('should normalize ERC-721 NFT with metadata', () => {
      const nft = normalizeERC721(
        '0xContractAddress',
        '123',
        mockMetadata,
        '0xOwnerAddress'
      );

      expect(nft.chain).toBe('ethereum');
      expect(nft.contractAddress).toBe('0xContractAddress');
      expect(nft.tokenId).toBe('123');
      expect(nft.owner).toBe('0xOwnerAddress');
      expect(nft.standard).toBe('ERC721');
      expect(nft.name).toBe('Test NFT');
      expect(nft.description).toBe('A test NFT');
      expect(nft.image).toContain('cloudflare-ipfs.com');
      expect(nft.attributes).toHaveLength(2);
    });

    it('should handle NFT without metadata', () => {
      const nft = normalizeERC721(
        '0xContractAddress',
        '123',
        null,
        '0xOwnerAddress'
      );

      expect(nft.chain).toBe('ethereum');
      expect(nft.contractAddress).toBe('0xContractAddress');
      expect(nft.tokenId).toBe('123');
      expect(nft.name).toBeUndefined();
      expect(nft.description).toBeUndefined();
      expect(nft.image).toBeUndefined();
    });

    it('should resolve IPFS URLs', () => {
      const nft = normalizeERC721(
        '0xContract',
        '1',
        { ...mockMetadata, image: 'ipfs://QmHash' },
        '0xOwner'
      );

      expect(nft.image).toBe('https://cloudflare-ipfs.com/ipfs/QmHash');
    });

    it('should use custom IPFS gateway', () => {
      const nft = normalizeERC721(
        '0xContract',
        '1',
        { ...mockMetadata, image: 'ipfs://QmHash' },
        '0xOwner',
        'custom-gateway.com'
      );

      expect(nft.image).toBe('https://custom-gateway.com/ipfs/QmHash');
    });

    it('should handle animation URLs', () => {
      const metadataWithAnimation = {
        ...mockMetadata,
        animation_url: 'ipfs://QmAnimation',
      };

      const nft = normalizeERC721(
        '0xContract',
        '1',
        metadataWithAnimation,
        '0xOwner'
      );

      expect(nft.animationUrl).toBe('https://cloudflare-ipfs.com/ipfs/QmAnimation');
    });
  });

  describe('ERC-1155 Normalization', () => {
    it('should normalize ERC-1155 NFT with balance', () => {
      const nft = normalizeERC1155(
        '0xContractAddress',
        '456',
        mockMetadata,
        '0xOwnerAddress',
        10
      );

      expect(nft.chain).toBe('ethereum');
      expect(nft.standard).toBe('ERC1155');
      expect(nft.balance).toBe(10);
      expect(nft.tokenId).toBe('456');
    });

    it('should handle zero balance', () => {
      const nft = normalizeERC1155(
        '0xContract',
        '1',
        mockMetadata,
        '0xOwner',
        0
      );

      expect(nft.balance).toBe(0);
    });

    it('should handle large balances', () => {
      const nft = normalizeERC1155(
        '0xContract',
        '1',
        mockMetadata,
        '0xOwner',
        1000000
      );

      expect(nft.balance).toBe(1000000);
    });
  });

  describe('Metaplex Normalization', () => {
    const solanaMetadata = {
      name: 'Solana NFT',
      description: 'A Solana NFT',
      image: 'https://arweave.net/test',
      attributes: [{ trait_type: 'Type', value: 'Legendary' }],
    };

    it('should normalize Metaplex NFT', () => {
      const nft = normalizeMetaplex(
        'MintAddress123',
        solanaMetadata,
        'OwnerPubkey'
      );

      expect(nft.chain).toBe('solana');
      expect(nft.contractAddress).toBe('MintAddress123');
      expect(nft.tokenId).toBe('0');
      expect(nft.owner).toBe('OwnerPubkey');
      expect(nft.standard).toBe('Metaplex');
      expect(nft.name).toBe('Solana NFT');
    });

    it('should resolve Arweave URLs', () => {
      const metadata = {
        ...solanaMetadata,
        image: 'ar://ArweaveHash',
      };

      const nft = normalizeMetaplex('Mint', metadata, 'Owner');
      expect(nft.image).toBe('https://arweave.net/ArweaveHash');
    });
  });

  describe('Spam Detection', () => {
    it('should detect spam by name', () => {
      const spamNFT = normalizeERC721(
        '0xContract',
        '1',
        { ...mockMetadata, name: 'Free Airdrop Claim Now!' },
        '0xOwner'
      );

      expect(spamNFT.isSpam).toBe(true);
    });

    it('should detect spam by description', () => {
      const spamNFT = normalizeERC721(
        '0xContract',
        '1',
        { ...mockMetadata, description: 'Visit our website to claim your reward' },
        '0xOwner'
      );

      expect(spamNFT.isSpam).toBe(true);
    });

    it('should not flag legitimate NFTs as spam', () => {
      const legitimateNFT = normalizeERC721(
        '0xContract',
        '1',
        { ...mockMetadata, name: 'Bored Ape #1234' },
        '0xOwner'
      );

      expect(legitimateNFT.isSpam).toBe(false);
    });

    it('should detect multiple spam keywords', () => {
      const testCases = [
        'Claim your free prize now!',
        'AIRDROP - Click here to mint',
        'Bonus reward for winners',
        'Gift for you - Visit now',
      ];

      testCases.forEach(name => {
        const nft = normalizeERC721(
          '0xContract',
          '1',
          { ...mockMetadata, name },
          '0xOwner'
        );
        expect(nft.isSpam).toBe(true);
      });
    });

    it('should be case-insensitive', () => {
      const nft = normalizeERC721(
        '0xContract',
        '1',
        { ...mockMetadata, name: 'FREE AIRDROP' },
        '0xOwner'
      );

      expect(nft.isSpam).toBe(true);
    });
  });

  describe('Magic Eden Link Generation', () => {
    it('should generate Magic Eden link for Ethereum NFT', () => {
      const nft = normalizeERC721(
        '0xContractAddress',
        '123',
        mockMetadata,
        '0xOwner'
      );

      const link = getMagicEdenLink(nft);
      expect(link).toBe('https://magiceden.io/item-details/ethereum/0xContractAddress/123');
    });

    it('should generate Magic Eden link for Solana NFT', () => {
      const nft = normalizeMetaplex(
        'MintAddress123',
        mockMetadata,
        'Owner'
      );

      const link = getMagicEdenLink(nft);
      expect(link).toBe('https://magiceden.io/item-details/MintAddress123');
    });

    it('should handle ERC-1155', () => {
      const nft = normalizeERC1155(
        '0xContract',
        '456',
        mockMetadata,
        '0xOwner',
        1
      );

      const link = getMagicEdenLink(nft);
      expect(link).toBe('https://magiceden.io/item-details/ethereum/0xContract/456');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing attributes', () => {
      const metadata = { ...mockMetadata, attributes: undefined };
      const nft = normalizeERC721('0xContract', '1', metadata, '0xOwner');

      expect(nft.attributes).toBeUndefined();
    });

    it('should handle empty strings', () => {
      const metadata = {
        name: '',
        description: '',
        image: '',
      };

      const nft = normalizeERC721('0xContract', '1', metadata, '0xOwner');
      expect(nft.name).toBe('');
      expect(nft.description).toBe('');
    });

    it('should handle collection metadata', () => {
      const metadata = {
        ...mockMetadata,
        collection: {
          name: 'Test Collection',
          family: 'Test Family',
        },
      };

      const nft = normalizeERC721('0xContract', '1', metadata, '0xOwner');
      expect(nft.collection?.name).toBe('Test Collection');
      expect(nft.collection?.family).toBe('Test Family');
    });

    it('should preserve original metadata', () => {
      const nft = normalizeERC721('0xContract', '1', mockMetadata, '0xOwner');
      expect(nft.metadata).toEqual(mockMetadata);
    });
  });
});
