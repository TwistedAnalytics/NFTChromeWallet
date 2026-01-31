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
      setError(result.error || 'Incorrect password');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-[#1a1625] via-[#2d1b3d] to-[#1a1625]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4 shadow-xl shadow-purple-500/50">
            <span className="text-white font-bold text-4xl">V</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-gray-400">Enter your password to unlock</p>
        </div>

        {/* Unlock Form */}
        <div className="card">
          <form onSubmit={handleUnlock} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                className="input w-full text-lg"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                disabled={isUnlocking}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isUnlocking || !password}
            >
              {isUnlocking ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Unlocking...</span>
                </div>
              ) : (
                'Unlock'
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                onClick={() => {
                  if (confirm('This will reset your wallet. Make sure you have your recovery phrase saved!')) {
                    chrome.storage.local.clear().then(() => {
                      window.location.reload();
                    });
                  }
                }}
              >
                Forgot password? Reset wallet
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
