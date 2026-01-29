/**
 * EIP-1193 Ethereum Provider
 */
export class EthereumProvider {
  private requestId = 0;
  private pendingRequests = new Map<string, { resolve: Function; reject: Function }>();
  public isVaultNFT = true;
  public isMetaMask = false; // Don't impersonate MetaMask
  public selectedAddress: string | null = null;
  public chainId: string | null = null;
  public networkVersion: string | null = null;

  constructor() {
    this.setupMessageListener();
  }

  private setupMessageListener() {
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      const message = event.data;
      if (message && message.target === 'vaultNFT-page' && message.requestId) {
        const pending = this.pendingRequests.get(message.requestId);
        if (pending) {
          this.pendingRequests.delete(message.requestId);
          if (message.response.success) {
            pending.resolve(message.response.data);
          } else {
            pending.reject(new Error(message.response.error));
          }
        }
      }
    });
  }

  private async sendMessage(type: string, data?: any): Promise<any> {
    const requestId = `req-${this.requestId++}`;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      window.postMessage(
        {
          target: 'vaultNFT-background',
          type,
          data,
          requestId,
        },
        '*'
      );

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  async request(args: { method: string; params?: any[] }): Promise<any> {
    const { method, params = [] } = args;

    switch (method) {
      case 'eth_requestAccounts': {
        const accounts = await this.sendMessage('PERMISSION_REQUEST', {
          chain: 'ethereum',
          requestedPermissions: ['connect'],
        });
        if (accounts && accounts.length > 0) {
          this.selectedAddress = accounts[0];
        }
        return accounts;
      }

      case 'eth_accounts': {
        const account = await this.sendMessage('ACCOUNT_GET_CURRENT', { chain: 'ethereum' });
        return account ? [account.address] : [];
      }

      case 'eth_chainId': {
        return this.chainId || '0x1';
      }

      case 'net_version': {
        return this.networkVersion || '1';
      }

      case 'personal_sign': {
        const [message, address] = params;
        return this.sendMessage('SIGN_MESSAGE', {
          message,
          chain: 'ethereum',
          address,
        });
      }

      case 'eth_sign': {
        const [address, message] = params;
        return this.sendMessage('SIGN_MESSAGE', {
          message,
          chain: 'ethereum',
          address,
        });
      }

      case 'eth_signTypedData':
      case 'eth_signTypedData_v3':
      case 'eth_signTypedData_v4': {
        const [address, typedData] = params;
        return this.sendMessage('SIGN_MESSAGE', {
          message: JSON.stringify(typedData),
          chain: 'ethereum',
          address,
        });
      }

      case 'eth_sendTransaction': {
        const [transaction] = params;
        return this.sendMessage('SEND_TRANSACTION', {
          transaction,
          chain: 'ethereum',
          address: transaction.from,
        });
      }

      case 'eth_signTransaction': {
        const [transaction] = params;
        return this.sendMessage('SIGN_TRANSACTION', {
          transaction,
          chain: 'ethereum',
          address: transaction.from,
        });
      }

      default:
        throw new Error(`Method ${method} not supported`);
    }
  }

  // Legacy methods for compatibility
  async enable(): Promise<string[]> {
    return this.request({ method: 'eth_requestAccounts' });
  }

  async send(method: string, params?: any[]): Promise<any> {
    return this.request({ method, params });
  }

  // Event emitter compatibility
  on(event: string, handler: Function): void {
    // Simplified event emitter
  }

  removeListener(event: string, handler: Function): void {
    // Simplified event emitter
  }
}
