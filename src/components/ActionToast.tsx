// src/components/ActionToast.tsx
import React, { useEffect, useState } from 'react';
import type { TurnSummary, StatChangeDetail } from '../types';
import '../styles/ActionToast.css';

interface ActionToastProps {
  summary?: TurnSummary;
}

const ActionToast: React.FC<ActionToastProps> = ({ summary }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (summary) {
      setShow(true);
      // Automatically hide the toast after 5 seconds
      const timer = setTimeout(() => setShow(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [summary?.summaryId]); 

  if (!summary || !show) return null;

  const formatImagePath = (path: string | undefined) => {
    if (!path) return '/assets/tiles/basic/suburbs.webp';
    const cleanPath = path.replace(/^\/+/, '');
    return `/${cleanPath}`;
  };

  const renderStatChange = (change: StatChangeDetail, index: number, showReason: boolean = true) => (
    <div key={`toast-stat-${index}`} className={`toast-stat-row ${!showReason ? 'no-reason' : ''}`}>
      <span className={`toast-change-value ${change.stat} ${change.value < 0 ? 'loss' : ''}`}>
        {change.value > 0 ? '+' : ''}{change.value}
        <img 
          src={`/assets/tags/${change.stat}.webp`} 
          className="toast-tag-icon" 
          alt={change.stat} 
        />
      </span>
      <span className="toast-source-name">{change.source}</span>
      {showReason && <span className="toast-reason-text">{change.reason}</span>}
    </div>
  );

  const hasStats = 
    (summary.immediateEffects?.length > 0) ||
    (summary.conditionalEffects?.length > 0) ||
    (summary.upkeepEffects?.length > 0) ||
    (summary.redLineEffects?.length > 0);

  return (
    <div className="action-toast-wrapper">
      <div key={summary.summaryId} className="action-toast">
        
        {/* Top Header Row */}
        <div className={`toast-top-row ${hasStats ? 'has-stats' : ''}`}>
          <div className="toast-player-col">
            <img 
              src={`/assets/colors/${summary.playerColor}.webp`} 
              alt={summary.playerColor} 
              className="toast-gem" 
            />
            <span className="toast-player-name">{summary.playerName}</span>
          </div>

          <div className="toast-tile-wrapper">
            <img 
              src={formatImagePath(summary.actionImage)} 
              className="toast-tile-img" 
              alt="action visual"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/tiles/basic/suburbs.webp';
              }}
            />
            {summary.isInvestment && (
              <div className="toast-invest-overlay" title="Investment Marker Attached">💰</div>
            )}
          </div>
          
          <div className="toast-content">
            <div className="toast-action">{summary.actionLabel || 'Action Completed'}</div>
            {summary.actionCost !== undefined && summary.actionCost !== null && (
              <div className="toast-cost">Cost: ${summary.actionCost}</div>
            )}
          </div>
        </div>

        {/* Detailed Stats Section (if applicable) */}
        {hasStats && (
          <div className="toast-stats-container">
            {summary.immediateEffects?.length > 0 && (
              <div className="toast-section">
                <h4 className="toast-section-header">Immediate Effects</h4>
                {summary.immediateEffects.map((change, i) => renderStatChange(change, i))}
              </div>
            )}
            {summary.conditionalEffects?.length > 0 && (
              <div className="toast-section">
                <h4 className="toast-section-header">Conditional Effects</h4>
                {summary.conditionalEffects.map((change, i) => renderStatChange(change, i + 100))}
              </div>
            )}
            
            {(summary.upkeepEffects?.length > 0 || summary.redLineEffects?.length > 0) && (
              <div className="toast-side-by-side">
                {summary.upkeepEffects?.length > 0 && (
                  <div className="toast-section upkeep-section">
                    <h4 className="toast-section-header">Upkeep</h4>
                    {summary.upkeepEffects.map((change, i) => renderStatChange(change, i + 200, false))}
                  </div>
                )}
                {summary.redLineEffects?.length > 0 && (
                  <div className="toast-section redline-section">
                    <h4 className="toast-section-header">Red Lines Crossed</h4>
                    {summary.redLineEffects.map((change, i) => renderStatChange(change, i + 300, false))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ActionToast;