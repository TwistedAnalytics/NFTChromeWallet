class PublicKey {
  constructor(public value: string) {}

  toString(): string {
    return this.value;
  }

  toBase58(): string {
    return this.value;
  }

  toBytes(): Uint8Array {
    return new Uint8Array();
  }
}

export class SolanaProvider {
  public isVaultNFT = true;
  public isPhantom = true;
  public publicKey: PublicKey | null = null;
  private connected = false;
  private requestId = 0;
  private pendingRequests = new Map<string, any>();
  private _events: { [key: string]: Function[] } = {};

  constructor() {
    console.log('SolanaProvider constructed');
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

      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  async connect(): Promise<{ publicKey: PublicKey }> {
    const account = await this.sendMessage('PERMISSION_REQUEST', {
      chain: 'solana',
      requestedPermissions: ['connect'],
    });

    if (account && account.address) {
      this.publicKey = new PublicKey(account.address);
      this.connected = true;
      this.emit('connect', this.publicKey);
    }

    return { publicKey: this.publicKey! };
  }

  async disconnect(): Promise<void> {
    this.publicKey = null;
    this.connected = false;
    this.emit('disconnect');
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

  on(event: string, handler: Function): void {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(handler);
  }

  off(event: string, handler: Function): void {
    if (!this._events[event]) return;
    this._events[event] = this._events[event].filter(h => h !== handler);
  }

  private emit(event: string, ...args: any[]): void {
    if (!this._events[event]) return;
    this._events[event].forEach(handler => handler(...args));
  }
}
