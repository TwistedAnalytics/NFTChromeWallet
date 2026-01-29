import React from 'react';

interface ConnectedSitesProps {
  sites: string[];
  onDisconnect: (origin: string) => void;
}

export const ConnectedSites: React.FC<ConnectedSitesProps> = ({ sites, onDisconnect }) => {
  if (sites.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Connected Sites</h3>
        <p className="text-gray-400 text-center py-4">No connected sites</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Connected Sites</h3>
      <div className="space-y-2">
        {sites.map((site) => (
          <div
            key={site}
            className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
          >
            <span className="text-sm">{site}</span>
            <button
              onClick={() => onDisconnect(site)}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Disconnect
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
