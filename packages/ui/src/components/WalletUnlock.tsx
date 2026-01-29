import React, { useState } from 'react';

interface WalletUnlockProps {
  onSubmit: (password: string) => Promise<{ success: boolean; error?: string }>;
}

export const WalletUnlock: React.FC<WalletUnlockProps> = ({ onSubmit }) => {
  const [password, setPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsUnlocking(true);
    setError(null);

    const result = await onSubmit(password);

    setIsUnlocking(false);

    if (!result.success) {
      setError(result.error || 'Failed to unlock wallet');
      setPassword('');
    }
  };

  return (
    <div className="card max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Unlock Wallet</h2>

      <form onSubmit={handleUnlock}>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            className="input-field"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={isUnlocking || !password}
        >
          {isUnlocking ? 'Unlocking...' : 'Unlock'}
        </button>
      </form>
    </div>
  );
};
