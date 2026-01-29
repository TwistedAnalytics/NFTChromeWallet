/**
 * EIP-6963: Multi Injected Provider Discovery
 */
export function announceProvider(provider: any): void {
  const info = {
    uuid: 'vaultnft-ethereum-provider',
    name: 'VaultNFT',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgZmlsbD0iIzYzNjZmMSIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5WPC90ZXh0Pgo8L3N2Zz4=',
    rdns: 'io.vaultnft',
  };

  const announceEvent = new CustomEvent('eip6963:announceProvider', {
    detail: Object.freeze({ info, provider }),
  });

  window.dispatchEvent(announceEvent);

  // Listen for requests from dApps
  window.addEventListener('eip6963:requestProvider', () => {
    window.dispatchEvent(announceEvent);
  });
}
