import { Connection, PublicKey } from '@solana/web3.js';
import { resolveIPFS } from '@nft-wallet/shared';

/**
 * Metaplex Token Metadata Program ID
 */
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

/**
 * Get token accounts for owner
 */
export async function getTokenAccounts(
  owner: string,
  connection: Connection
): Promise<Array<{ mint: string; amount: number }>> {
  try {
    const ownerPubkey = new PublicKey(owner);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(ownerPubkey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    });

    return tokenAccounts.value
      .filter(account => {
        const amount = account.account.data.parsed.info.tokenAmount.uiAmount;
        return amount > 0;
      })
      .map(account => ({
        mint: account.account.data.parsed.info.mint,
        amount: account.account.data.parsed.info.tokenAmount.uiAmount,
      }));
  } catch (error) {
    console.error('Error fetching token accounts:', error);
    return [];
  }
}

/**
 * Derive metadata PDA for a mint
 */
export function getMetadataPDA(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );
  return pda;
}

/**
 * Fetch on-chain metadata
 */
export async function fetchOnChainMetadata(
  mint: string,
  connection: Connection
): Promise<any | null> {
  try {
    const mintPubkey = new PublicKey(mint);
    const metadataPDA = getMetadataPDA(mintPubkey);

    const accountInfo = await connection.getAccountInfo(metadataPDA);
    if (!accountInfo) {
      return null;
    }

    // Parse metadata (simplified - in production, use @metaplex-foundation/mpl-token-metadata)
    const data = accountInfo.data;

    // This is a simplified parser - in production, use proper Metaplex SDK
    return {
      mint,
      data: data.toString('base64'),
    };
  } catch (error) {
    console.error('Error fetching on-chain metadata:', error);
    return null;
  }
}

/**
 * Fetch off-chain metadata from URI
 */
export async function fetchOffChainMetadata(
  uri: string,
  ipfsGateway: string = 'cloudflare-ipfs.com'
): Promise<any | null> {
  try {
    const resolvedUri = resolveIPFS(uri, ipfsGateway);
    const response = await fetch(resolvedUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching off-chain metadata:', error);
    return null;
  }
}

/**
 * Fetch complete Metaplex NFT metadata
 */
export async function fetchMetaplexNFT(
  mint: string,
  connection: Connection,
  ipfsGateway: string = 'cloudflare-ipfs.com'
): Promise<any | null> {
  try {
    const onChainMetadata = await fetchOnChainMetadata(mint, connection);
    if (!onChainMetadata) {
      return null;
    }

    // In production, extract URI from on-chain metadata and fetch off-chain data
    // For now, return simplified metadata
    return {
      mint,
      onChain: onChainMetadata,
      offChain: null,
    };
  } catch (error) {
    console.error('Error fetching Metaplex NFT:', error);
    return null;
  }
}

/**
 * Fetch all NFTs for owner
 */
export async function fetchNFTs(
  owner: string,
  connection: Connection,
  ipfsGateway: string = 'cloudflare-ipfs.com'
): Promise<any[]> {
  const tokenAccounts = await getTokenAccounts(owner, connection);

  // Filter for NFTs (amount === 1 and decimals === 0)
  const nftAccounts = tokenAccounts.filter(account => account.amount === 1);

  // Fetch metadata for each NFT
  const nfts = await Promise.all(
    nftAccounts.map(account => fetchMetaplexNFT(account.mint, connection, ipfsGateway))
  );

  return nfts.filter(nft => nft !== null);
}
