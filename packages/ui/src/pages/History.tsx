import React, { useEffect, useState } from 'react';
import { useWallet } from '../hooks/useWallet';

interface Transaction {
  signature: string;
  timestamp: number;
  type: 'sent' | 'received';
  chain: 'solana' | 'ethereum';
  amount?: string;
  token?: string;
  from?: string;
  to?: string;
  status: 'success' | 'failed';
  explorerUrl: string;
}

export const History: React.FC = () => {
  const { address, ethAddress } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [address, ethAddress]);

  const fetchTransactions = async () => {
    if (!address && !ethAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      const allTransactions: Transaction[] = [];

      // Fetch Solana transactions
      if (address) {
        const solTxs = await fetchSolanaTransactions(address);
        allTransactions.push(...solTxs);
      }

      // Fetch Ethereum transactions
      if (ethAddress) {
        const ethTxs = await fetchEthereumTransactions(ethAddress);
        allTransactions.push(...ethTxs);
      }

      // Sort by timestamp (newest first)
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);

      setTransactions(allTransactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transaction history');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSolanaTransactions = async (solAddress: string): Promise<Transaction[]> => {
    try {
      const HELIUS_API_KEY = '647bbd34-42b3-418b-bf6c-c3a40813b41c';
      
      const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'history',
          method: 'getSignaturesForAddress',
          params: [solAddress, { limit: 20 }]
        })
      });

      const data = await response.json();
      
      if (!data.result) return [];

      return data.result.map((tx: any) => ({
        signature: tx.signature,
        timestamp: tx.blockTime * 1000,
        type: 'sent' as const, // We'll need to parse transaction details for accurate type
        chain: 'solana' as const,
        status: tx.err ? 'failed' : 'success',
        explorerUrl: `https://solscan.io/tx/${tx.signature}`
      }));
    } catch (error) {
      console.error('Error fetching Solana transactions:', error);
      return [];
    }
  };

  const fetchEthereumTransactions = async (ethAddr: string): Promise<Transaction[]> => {
    try {
      const ALCHEMY_API_KEY = 'WD0X0NprnF2uHt6pb_dWC';
      
      const response = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'alchemy_getAssetTransfers',
          params: [{
            fromBlock: '0x0',
            toBlock: 'latest',
            fromAddress: ethAddr,
            category: ['external', 'internal', 'erc20', 'erc721', 'erc1155'],
            maxCount: '0x14' // 20 transactions
          }]
        })
      });

      const data = await response.json();
      
      if (!data.result || !data.result.transfers) return [];

      return data.result.transfers.map((tx: any) => ({
        signature: tx.hash,
        timestamp: new Date(tx.metadata.blockTimestamp).getTime(),
        type: tx.from.toLowerCase() === ethAddr.toLowerCase() ? 'sent' : 'received',
        chain: 'ethereum' as const,
        amount: tx.value ? tx.value.toString() : undefined,
        token: tx.asset,
        from: tx.from,
        to: tx.to,
        status: 'success' as const,
        explorerUrl: `https://etherscan.io/tx/${tx.hash}`
      }));
    } catch (error) {
      console.error('Error fetching Ethereum transactions:', error);
      return [];
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-6">Transaction History</h2>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="text-gray-400 mt-4">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-6">Transaction History</h2>
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-400">{error}</p>
          <button 
            onClick={fetchTransactions}
            className="mt-4 text-purple-400 hover:text-purple-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-6">Transaction History</h2>
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-400 text-lg mb-2">No transactions yet</p>
          <p className="text-gray-500 text-sm">Your transaction history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Transaction History</h2>
        <button
          onClick={fetchTransactions}
          className="p-2 hover:bg-white/10 rounded-lg transition-all"
          title="Refresh"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="space-y-2">
        {transactions.map((tx) => (
          <a
            key={tx.signature}
            href={tx.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === 'sent' 
                    ? 'bg-orange-500/20' 
                    : 'bg-green-500/20'
                }`}>
                  {tx.type === 'sent' ? (
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  )}
                </div>

                {/* Details */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white capitalize">{tx.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      tx.chain === 'solana' 
                        ? 'bg-purple-500/20 text-purple-300' 
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {tx.chain === 'solana' ? 'SOL' : 'ETH'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {tx.amount && tx.token ? `${tx.amount} ${tx.token}` : formatAddress(tx.signature)}
                  </p>
                </div>
              </div>

              {/* Time */}
              <div className="text-right">
                <p className="text-sm text-gray-400">{formatDate(tx.timestamp)}</p>
                <div className="flex items-center gap-1 justify-end mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    tx.status === 'success' ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className="text-xs text-gray-500 capitalize">{tx.status}</span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
