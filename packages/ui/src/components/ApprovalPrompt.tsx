import React, { useState, useEffect } from 'react';
import { useMessaging } from '../hooks/useMessaging';

export const ApprovalPrompt: React.FC = () => {
  const { send } = useMessaging();
  const [origin, setOrigin] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const originParam = params.get('origin');
    if (originParam) {
      setOrigin(originParam);
    }
  }, []);

  const handleApprove = async () => {
    setIsProcessing(true);
    await send({
      type: 'APPROVE_CONNECTION',
      data: { origin, approved: true },
    });
    window.close();
  };

  const handleReject = async () => {
    setIsProcessing(true);
    await send({
      type: 'APPROVE_CONNECTION',
      data: { origin, approved: false },
    });
    window.close();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Connection Request</h2>
        
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

        <div className="flex gap-3">
          <button
            onClick={handleReject}
            className="btn-secondary flex-1"
            disabled={isProcessing}
          >
            Reject
          </button>
          <button
            onClick={handleApprove}
            className="btn-primary flex-1"
            disabled={isProcessing}
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
};
