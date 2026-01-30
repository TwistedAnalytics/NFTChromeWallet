import React, { useState } from 'react';

interface WalletCreateProps {
  onSubmit: (password: string, mnemonic?: string) => Promise<{ success: boolean; error?: string; mnemonic?: string }>;
}

export const WalletCreate: React.FC<WalletCreateProps> = ({ onSubmit }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [importMnemonic, setImportMnemonic] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedMnemonic, setGeneratedMnemonic] = useState<string | null>(null);

  const handleCreate = async () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsCreating(true);
    setError(null);

    const result = await onSubmit(password, isImporting ? importMnemonic : undefined);

console.log('Wallet creation result:', result);

setIsCreating(false);

if (result.success) {
  if (result.mnemonic) {
    console.log('Setting generated mnemonic');
    setGeneratedMnemonic(result.mnemonic);
  } else {
    console.log('No mnemonic returned, wallet imported or error');
  }
} else {
  setError(result.error || 'Failed to create wallet');
}

  if (generatedMnemonic) {
    return (
      <div className="card max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Backup Your Recovery Phrase</h2>
        <div className="mb-4 p-4 bg-yellow-900/30 border border-yellow-600 rounded-lg">
          <p className="text-sm text-yellow-200 mb-2">
            Write down these words in order and keep them safe. You'll need them to recover your wallet.
          </p>
        </div>
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <p className="text-sm font-mono leading-relaxed">{generatedMnemonic}</p>
        </div>
        <button
          onClick={() => window.close()}
          className="btn-primary w-full"
        >
          I've Saved My Recovery Phrase
        </button>
      </div>
    );
  }

  return (
    <div className="card max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Create Wallet</h2>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setIsImporting(false)}
          className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
            !isImporting
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Create New
        </button>
        <button
          onClick={() => setIsImporting(true)}
          className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
            isImporting
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Import Existing
        </button>
      </div>

      {isImporting && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Recovery Phrase</label>
          <textarea
            className="input-field min-h-[100px]"
            placeholder="Enter your 12-word recovery phrase..."
            value={importMnemonic}
            onChange={(e) => setImportMnemonic(e.target.value)}
          />
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Password</label>
        <input
          type="password"
          className="input-field"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Confirm Password</label>
        <input
          type="password"
          className="input-field"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleCreate}
        className="btn-primary w-full"
        disabled={isCreating}
      >
        {isCreating ? 'Creating...' : isImporting ? 'Import Wallet' : 'Create Wallet'}
      </button>
    </div>
  );
};
};
