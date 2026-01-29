import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import type { NormalizedNFT } from '@nft-wallet/shared';

/**
 * Build SPL token transfer transaction
 */
export async function buildTokenTransfer(
  mint: string,
  from: string,
  to: string,
  amount: number,
  connection: Connection
): Promise<Transaction> {
  const mintPubkey = new PublicKey(mint);
  const fromPubkey = new PublicKey(from);
  const toPubkey = new PublicKey(to);

  // Get or create associated token accounts
  const fromTokenAccount = await getAssociatedTokenAddress(mintPubkey, fromPubkey);
  const toTokenAccount = await getAssociatedTokenAddress(mintPubkey, toPubkey);

  const transaction = new Transaction();

  // Check if recipient token account exists
  const toAccountInfo = await connection.getAccountInfo(toTokenAccount);
  if (!toAccountInfo) {
    // Create associated token account for recipient
    transaction.add(
      createAssociatedTokenAccountInstruction(
        fromPubkey, // payer
        toTokenAccount, // associated token account
        toPubkey, // owner
        mintPubkey, // mint
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  // Add transfer instruction
  transaction.add(
    createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromPubkey,
      amount,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;

  return transaction;
}

/**
 * Build NFT transfer transaction
 */
export async function buildNFTTransfer(
  nft: NormalizedNFT,
  from: string,
  to: string,
  connection: Connection
): Promise<Transaction> {
  // For Metaplex NFTs, amount is always 1
  return buildTokenTransfer(nft.contractAddress, from, to, 1, connection);
}

/**
 * Estimate transaction fee
 */
export async function estimateTransactionFee(
  transaction: Transaction,
  connection: Connection
): Promise<number> {
  try {
    const fee = await transaction.getEstimatedFee(connection);
    return fee ? fee / LAMPORTS_PER_SOL : 0;
  } catch (error) {
    console.error('Error estimating fee:', error);
    return 0;
  }
}
