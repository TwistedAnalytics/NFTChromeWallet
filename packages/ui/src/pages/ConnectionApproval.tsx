import React, { useEffect, useState } from 'react';

interface ConnectionRequest {
  type: 'connect';
  origin: string;
  chain: string;
  address: string;
  timestamp: number;
}

export const ConnectionApproval: React.FC = () => {
  const [request, setRequest] = useState<ConnectionRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Extract requestId from URL
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const requestId = params.get('requestId');

    if (!requestId) {
      console.error('No requestId in URL');
      window.close();
      return;
    }

    // Load the request from storage
    chrome.storage.local.get([requestId], (result) => {
      const req = result[requestId];
      if (req) {
        setRequest(req);
        setIsLoading(false);
      } else {
        console.error('Request not found:', requestId);
        window.close();
      }
    });
  }, []);

  const handleApprove = async () => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const requestId = params.get('requestId');

    if (requestId) {
      await chrome.storage.local.set({
        [`${requestId}_result`]: { approved: true }
      });
      window.close();
    }
  };

  const handleReject = async () => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const requestId = params.get('requestId');

    if (requestId) {
      await chrome.storage.local.set({
        [`${requestId}_result`]: { approved: false }
      });
      window.close();
    }
  };

  if (isLoading) {
    return (
      <div className="h-[600px] w-full bg-gradient-to-br from-[#1a1625] via-[#2d1b3d] to-[#1a1625] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return null;
  }

  const domain = new URL(request.origin).hostname;

  return (
    <div className="h-[600px] w-full bg-gradient-to-br from-[#1a1625] via-[#2d1b3d] to-[#1a1625] flex flex-col">
      {/* Header */}
      <div className="flex-none p-6 text-center border-b border-purple-900/30">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Connection Request</h1>
        <p className="text-gray-400 text-sm">A website wants to connect to your wallet</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="card mb-4">
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Website</p>
            <p className="text-white font-semibold">{domain}</p>
            <p className="text-xs text-gray-400 mt-1">{request.origin}</p>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Chain</p>
            <p className="text-white font-semibold capitalize">{request.chain}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Account</p>
            <p className="text-white font-mono text-sm break-all">{request.address}</p>
          </div>
        </div>

        <div className="card bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-yellow-500 font-semibold text-sm mb-1">Only connect to sites you trust</p>
              <p className="text-gray-400 text-xs">This site will be able to see your account balance and request transaction approvals.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex-none p-6 border-t border-purple-900/30 space-y-3">
        <button
          onClick={handleApprove}
          className="w-full btn-primary py-3"
        >
          Connect
        </button>
        <button
          onClick={handleReject}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
