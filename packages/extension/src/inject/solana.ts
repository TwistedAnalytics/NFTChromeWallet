export class SolanaProvider {
  public isVaultNFT = true;
  public isPhantom = false; // Set to true for better compatibility
  public publicKey: PublicKey | null = null;
  private connected = false;

  constructor() {
    console.log('SolanaProvider constructed');
  }

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

  async connect(): Promise<{ publicKey: any }> {
    const account = await this.sendMessage('PERMISSION_REQUEST', {
      chain: 'solana',
      requestedPermissions: ['connect'],
    });

    if (account) {
      this.publicKey = { toString: () => account.address };
    }

    return { publicKey: this.publicKey };
  }

  async disconnect(): Promise<void> {
    this.publicKey = null;
  }

  async signMessage(message: Uint8Array, display?: string): Promise<{ signature: Uint8Array }> {
    if (!this.publicKey) {
      throw new Error('Wallet not connected');
    }

    const messageStr = Buffer.from(message).toString('base64');
    const signature = await this.sendMessage('SIGN_MESSAGE', {
      message: messageStr,
      chain: 'solana',
      address: this.publicKey.toString(),
    });

    return {
      signature: Buffer.from(signature, 'base64'),
    };
  }

  async signTransaction(transaction: any): Promise<any> {
    if (!this.publicKey) {
      throw new Error('Wallet not connected');
    }

    return this.sendMessage('SIGN_TRANSACTION', {
      transaction: transaction.serialize ? transaction.serialize() : transaction,
      chain: 'solana',
      address: this.publicKey.toString(),
    });
  }

  async signAllTransactions(transactions: any[]): Promise<any[]> {
    return Promise.all(transactions.map(tx => this.signTransaction(tx)));
  }

  async signAndSendTransaction(transaction: any): Promise<{ signature: string }> {
    if (!this.publicKey) {
      throw new Error('Wallet not connected');
    }

    const result = await this.sendMessage('SEND_TRANSACTION', {
      transaction: transaction.serialize ? transaction.serialize() : transaction,
      chain: 'solana',
      address: this.publicKey.toString(),
    });

    return { signature: result };
  }

  // Event emitter compatibility
  on(event: string, handler: Function): void {
    // Simplified event emitter
  }

  off(event: string, handler: Function): void {
    // Simplified event emitter
  }
}

class PublicKey {
  constructor(public value: string) {}

  toString(): string {
    return this.value;
  }

  toBase58(): string {
    return this.value;
  }

  toBytes(): Uint8Array {
    // Simple base58 decode - you may need a proper implementation
    return new Uint8Array();
  }
}
