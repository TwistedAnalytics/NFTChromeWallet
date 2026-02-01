import React from 'react';

export const History: React.FC = () => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Transaction History</h2>
      
      <div className="text-center py-12">
        <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-400 text-lg mb-2">No transactions yet</p>
        <p className="text-gray-500 text-sm">Your transaction history will appear here</p>
      </div>
    </div>
  );
};
