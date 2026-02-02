import React, { useState } from 'react';
import { CopyButton } from './CopyButton';

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
  const [step, setStep] = useState<'welcome' | 'create' | 'import' | 'show-seed'>('welcome');

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

    setIsCreating(false);

    if (result.success) {
      if (result.mnemonic && !isImporting) {
        setGeneratedMnemonic(result.mnemonic);
        setStep('show-seed');
      }
    } else {
      setError(result.error || 'Failed to create wallet');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-[#1a1625] via-[#2d1b3d] to-[#1a1625]">
      <div className="w-full max-w-md">
        {step === 'welcome' && (
          <>
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-6 shadow-2xl shadow-purple-500/50">
                <span className="text-white font-bold text-5xl">V</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-3">VaultNFT</h1>
              <p className="text-gray-400 text-lg">Your gateway to Web3</p>
            </div>

            {/* Action Cards */}
            <div className="space-y-4">
              <button
                onClick={() => setStep('create')}
                className="w-full card hover:bg-white/5 transition-all group p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">Create New Wallet</h3>
                    <p className="text-sm text-gray-400">Get started with a new wallet</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsImporting(true);
                  setStep('import');
                }}
                className="w-full card hover:bg-white/5 transition-all group p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">Import Wallet</h3>
                    <p className="text-sm text-gray-400">Use your recovery phrase</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </>
        )}

        {(step === 'create' || step === 'import') && (
          <>
            <button
              onClick={() => {
                setStep('welcome');
                setIsImporting(false);
                setPassword('');
                setConfirmPassword('');
                setImportMnemonic('');
                setError(null);
              }}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="card">
              <h2 className="text-2xl font-bold text-white mb-6">
                {isImporting ? 'Import Wallet' : 'Create Wallet'}
              </h2>

              <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-4">
                {isImporting && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Recovery Phrase
                    </label>
                    <textarea
                      className="input w-full h-32 resize-none font-mono text-sm"
                      placeholder="Enter your 12 or 24 word recovery phrase"
                      value={importMnemonic}
                      onChange={(e) => setImportMnemonic(e.target.value)}
                      autoFocus
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    className="input w-full"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus={!isImporting}
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    className="input w-full"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  className="btn-primary w-full text-lg py-4 disabled:opacity-50"
                  disabled={isCreating || !password || !confirmPassword || (isImporting && !importMnemonic)}
                >
                  {isCreating ? 'Creating...' : isImporting ? 'Import Wallet' : 'Create Wallet'}
                </button>
              </form>
            </div>
          </>
        )}

        {step === 'show-seed' && generatedMnemonic && (
          <div className="card">
            <h2 className="text-2xl font-bold text-white mb-4">Your Recovery Phrase</h2>
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-xl mb-6">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-yellow-400">
                  Write down this phrase and store it safely. You'll need it to recover your wallet.
                </p>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-purple-500/30 rounded-xl p-4 mb-6">
              <p className="text-sm font-mono text-white leading-relaxed break-all">
                {generatedMnemonic}
              </p>
            </div>

            <button
              onClick={() => copyToClipboard(generatedMnemonic)}
              className="btn-secondary w-full mb-4"
            >
              📋 Copy to Clipboard
            </button>

            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full"
            >
              I've Saved It
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
