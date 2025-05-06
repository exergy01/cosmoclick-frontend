import React from 'react';
import { usePlayer } from '../context/PlayerContext';

const CenterPanel: React.FC = () => {
  const { player, debugData } = usePlayer();

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      color: '#00f0ff',
      fontFamily: 'Arial, sans-serif',
      zIndex: 10,
    }}>
      {player && (
        <div>
          <p>Cargo CCC: {player.cargoCCC.toFixed(2)}</p>
          {debugData && (
            <div style={{ fontSize: '0.8rem', color: '#ccc' }}>
              <p>Debug - Last Update: {new Date(debugData.lastUpdateTime || 0).toLocaleString()}</p>
              <p>Debug - Server Cargo: {debugData.cargoCCC?.toFixed(2) || 'N/A'}</p>
              <p>Debug - Mining Speed: {debugData.miningSpeed?.toFixed(4) || 'N/A'}</p>
              <p>Debug - Elapsed Time: {debugData.elapsedTime?.toFixed(0) || 'N/A'}s</p>
              <p>Debug - Offline CCC: {debugData.offlineCCC?.toFixed(2) || 'N/A'}</p>
              <p>Debug - Adjusted Cargo: {debugData.adjustedCargoCCC?.toFixed(2) || 'N/A'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CenterPanel;