import { Connection, ConnectionConfig } from '@solana/web3.js';

/**
 * Connection cache
 */
const connectionCache = new Map<string, Connection>();

/**
 * Get or create a cached connection
 */
export function getConnection(rpcUrl: string, config?: ConnectionConfig): Connection {
  let connection = connectionCache.get(rpcUrl);

  if (!connection) {
    connection = new Connection(rpcUrl, config || 'confirmed');
    connectionCache.set(rpcUrl, connection);
  }

  return connection;
}

/**
 * Clear connection cache
 */
export function clearConnectionCache(): void {
  connectionCache.clear();
}

/**
 * Get connection for network
 */
export function getNetworkConnection(networkId: string, networks: any[]): Connection {
  const network = networks.find(n => n.id === networkId);
  if (!network) {
    throw new Error(`Network ${networkId} not found`);
  }
  return getConnection(network.rpcUrl);
}
