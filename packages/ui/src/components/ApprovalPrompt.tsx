import React, { useState, useEffect } from 'react';
import { useMessaging } from '../hooks/useMessaging';

export const ApprovalPrompt: React.FC = () => {
  const { send } = useMessaging();
  const [type, setType] = useState<string>('');
  const [origin, setOrigin] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [chain, setChain] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get('type') || 'connect';
    const originParam = params.get('origin') || '';
    const messageParam = params.get('message') || '';
    const chainParam = params.get('chain') || '';
    
    setType(typeParam);
    setOrigin(originParam);
    setMessage(messageParam);
    setChain(chainParam);
  }, []);

  const handleApprove = async () => {
    setIsProcessing(true);
    
    if (type === 'sign') {
      // Send approval for signing
      await chrome.runtime.sendMessage({
        type: 'SIGN_APPROVED',
        data: { approved: true }
      });
    } else {
      // Send approval for connection
      await send({
        type: 'APPROVE_CONNECTION',
        data: { origin, approved: true },
      });
    }
    
    window.close();
  };

  const handleReject = async () => {
    setIsProcessing(true);
    
    if (type === 'sign') {
      // Send rejection for signing
      await chrome.runtime.sendMessage({
        type: 'SIGN_REJECTED',
        data: { approved: false }
      });
    } else {
      // Send rejection for connection
      await send({
        type: 'APPROVE_CONNECTION',
        data: { origin, approved: false },
      });
    }
    
    window.close();
  };

  // Decode base64 message if it's a sign request
  const getDecodedMessage = () => {
    try {
      const decoded = atob(message);
      return decoded;
    } catch {
      return message;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        {type === 'sign' ? (
          <>
            <h2 className="text-xl font-bold mb-4">🔏 Signature Request</h2>
            
            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">
                <strong className="text-white">{origin}</strong> wants you to sign a message
              </p>
              
              <div className="mt-4 p-3 bg-gray-800 rounded text-xs font-mono break-all max-h-48 overflow-y-auto">
                {getDecodedMessage()}
              </div>
              
              <p className="text-xs text-gray-400 mt-3">
                Chain: <span className="text-purple-400">{chain}</span>
              </p>
              
              <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded">
                <p className="text-xs text-yellow-400">
                  ⚠️ Only sign messages from sites you trust. Signing malicious messages can give attackers access to your account.
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">🔗 Connection Request</h2>
            
            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">
                <strong className="text-white">{origin}</strong> wants to connect to your wallet
              </p>
              <p className="text-xs text-gray-400">
                This site will be able to:
              </p>
              <ul className="text-xs text-gray-400 mt-2 space-y-1 list-disc list-inside">
                <li>View your wallet address</li>
                <li>Request transaction approvals</li>
                <li>View your NFTs</li>
              </ul>
            </div>
          </>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleReject}
            className="btn-secondary flex-1"
            disabled={isProcessing}
          >
            {type === 'sign' ? 'Cancel' : 'Reject'}
          </button>
          <button
            onClick={handleApprove}
            className="btn-primary flex-1"
            disabled={isProcessing}
          >
            {type === 'sign' ? 'Sign' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
};
