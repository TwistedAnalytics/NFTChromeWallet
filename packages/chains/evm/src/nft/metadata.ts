import { resolveIPFS } from '@nft-wallet/shared';
import type { NFTMetadata } from '@nft-wallet/shared';

/**
 * Fetch NFT metadata from URI
 */
export async function fetchMetadata(
  uri: string,
  ipfsGateway: string = 'cloudflare-ipfs.com'
): Promise<NFTMetadata | null> {
  if (!uri) return null;

  try {
    // Handle data URI
    if (uri.startsWith('data:application/json')) {
      const jsonData = uri.split(',')[1];
      const decoded = atob(jsonData);
      return JSON.parse(decoded);
    }

    // Resolve IPFS/Arweave URIs
    const resolvedUri = resolveIPFS(uri, ipfsGateway);

    // Fetch metadata
    const response = await fetch(resolvedUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
}

/**
 * Batch fetch multiple metadata URIs
 */
export async function fetchMetadataBatch(
  uris: string[],
  ipfsGateway: string = 'cloudflare-ipfs.com'
): Promise<Array<NFTMetadata | null>> {
  return Promise.all(uris.map(uri => fetchMetadata(uri, ipfsGateway)));
}
