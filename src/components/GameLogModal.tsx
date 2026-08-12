// src/components/GameLogModal.tsx
import React, { useMemo } from 'react';
import type { TurnSummary, StatChangeDetail, GameState } from '../types';
import { useGameData } from '../context/GameDataContext';
import '../styles/GameLogModal.css';

interface GameLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaries: TurnSummary[];
  gameState: GameState | null;
}

const GameLogModal: React.FC<GameLogModalProps> = ({ isOpen, onClose, summaries, gameState }) => {
  const { tiles } = useGameData();
  const getTileById = (id: string) => tiles[id];

  // FIX: useMemo must run unconditionally on every render (Rules of Hooks).
  // It was previously called after an early `if (!isOpen) return null;`,
  // which meant this hook was skipped whenever the modal was closed and
  // could desync from other hooks' call order.
  const tileCounts = useMemo(() => {
    const counts = { a: 0, b: 0, c: 0 };
    if (gameState?.tileStackAbc) {
      for (const tileId of gameState.tileStackAbc) {
        const tileInfo = getTileById(tileId);
        if (tileInfo) {
          if (tileInfo.set === 'A') counts.a++;
          else if (tileInfo.set === 'B') counts.b++;
          else if (tileInfo.set === 'C') counts.c++;
        }
      }
    }
    return counts;
  }, [gameState?.tileStackAbc, tiles]);

  if (!isOpen) return null;

  const formatImagePath = (path: string | undefined) => {
    if (!path) return '/assets/tiles/basic/suburbs.png';
    const cleanPath = path.replace(/^\/+/, '');
    return `/${cleanPath}`;
  };

  const renderStatChange = (change: StatChangeDetail, summaryId: string, index: number) => (
    <div key={`${summaryId}-stat-${index}`} className="log-stat-row">
      <span className={`log-change-value ${change.stat} ${change.value < 0 ? 'loss' : ''}`}>
        {change.value > 0 ? '+' : ''}{change.value}
        <img 
          src={`/assets/tags/${change.stat}.png`} 
          className="log-tag-icon" 
          alt={change.stat} 
        />
      </span>
      <span className="log-source-name">{change.source}</span>
      <span className="log-reason-text">{change.reason}</span>
    </div>
  );

  return (
    <div className="log-modal-overlay" onClick={onClose}>
      <div className="log-modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="log-modal-header">
          <div className="log-tile-counts">
            <div className="log-count-item">
              <span className="log-count-letter">A:</span>
              <span className="log-count-value">{tileCounts.a}</span>
            </div>
            <div className="log-count-item">
              <span className="log-count-letter">B:</span>
              <span className="log-count-value">{tileCounts.b}</span>
            </div>
            <div className="log-count-item">
              <span className="log-count-letter">C:</span>
              <span className="log-count-value">{tileCounts.c}</span>
            </div>
          </div>
          <h2>Game Log</h2>
          <button className="log-close-x" onClick={onClose} title="Close Archives">
            &times;
          </button>
        </header>

        <div className="log-modal-body">
          {[...summaries].reverse().map((summary) => (
            <div key={summary.summaryId} className={`log-card ${summary.isReaction ? 'is-reaction' : ''}`}>
              <div className="log-grid">                 
                <div className="log-col-visuals"> 
                  <div className="log-col-player">
                    <img 
                      src={`/assets/colors/${summary.playerColor}.png`} 
                      className="log-player-gem" 
                      alt={`${summary.playerColor} gem`} 
                    />
                    <div className="log-player-name">{summary.playerName}</div>
                  </div>

                  <div className="log-hex-wrapper">
                    <img 
                      src={formatImagePath(summary.actionImage)} 
                      className="log-tile-img" 
                      alt="action visual"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/tiles/basic/suburbs.png';
                      }}
                    />
                    {summary.isInvestment && (
                      <div className="log-invest-overlay" title="Investment Marker Attached">💰</div>
                    )}
                  </div>
                </div>                
                <div className="log-col-details">
                  <div className="log-action-header">
                    {summary.actionCost !== undefined && summary.actionCost !== null && (
                      <span className="log-price-tag">
                        -${summary.actionCost}
                      </span>
                    )}
                    <div className="log-action-label">
                      {summary.actionLabel || 'Action Completed'}
                    </div>
                  </div>

                  <div className="log-stats-container">
                    {summary.immediateEffects?.length > 0 && (
                      <div className="log-section">
                        <h4 className="log-section-header">Immediate Effects</h4>
                        {summary.immediateEffects.map((change, i) => renderStatChange(change, summary.summaryId, i))}
                      </div>
                    )}
                    {summary.conditionalEffects?.length > 0 && (
                      <div className="log-section">
                        <h4 className="log-section-header">Conditional Effects</h4>
                        {summary.conditionalEffects.map((change, i) => renderStatChange(change, summary.summaryId, i + 100))}
                      </div>
                    )}
                    {summary.upkeepEffects?.length > 0 && (
                      <div className="log-section">
                        <h4 className="log-section-header">Upkeep</h4>
                        {summary.upkeepEffects.map((change, i) => renderStatChange(change, summary.summaryId, i + 200))}
                      </div>
                    )}
                    {summary.redLineEffects?.length > 0 && (
                      <div className="log-section">
                        <h4 className="log-section-header">Red Lines Crossed</h4>
                        {summary.redLineEffects.map((change, i) => renderStatChange(change, summary.summaryId, i + 300))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ))}

          {summaries.length === 0 && (
            <div className="log-empty">
              <p>The archives are empty. Build something to begin the history of Bestagon Blvd.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameLogModal; 
