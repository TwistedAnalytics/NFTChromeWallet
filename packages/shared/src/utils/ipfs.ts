/**
 * Resolve IPFS URL to HTTP gateway URL
 */
export function resolveIPFS(url: string, gateway: string = 'cloudflare-ipfs.com'): string {
  if (!url) return '';

  // Already HTTP/HTTPS
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // IPFS protocol
  if (url.startsWith('ipfs://')) {
    const hash = url.replace('ipfs://', '');
    return `https://${gateway}/ipfs/${hash}`;
  }

  // Arweave protocol
  if (url.startsWith('ar://')) {
    const hash = url.replace('ar://', '');
    return `https://arweave.net/${hash}`;
  }

  // Direct IPFS hash
  if (url.startsWith('Qm') || url.startsWith('bafy')) {
    return `https://${gateway}/ipfs/${url}`;
  }

  return url;
}

/**
 * Check if URL is IPFS
 */
export function isIPFS(url: string): boolean {
  if (!url) return false;
  return url.startsWith('ipfs://') || url.startsWith('Qm') || url.startsWith('bafy');
}

/**
 * Check if URL is Arweave
 */
export function isArweave(url: string): boolean {
  if (!url) return false;
  return url.startsWith('ar://');
}
