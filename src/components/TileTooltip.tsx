// src/components/TileTooltip.tsx
import React from 'react';
import type { HexTile } from '../types';
import '../styles/TileTooltip.css';

interface TileTooltipProps {
  tile: HexTile;
  marketFee?: number;
  availableCount?: number; 
  y: number;  
}

const formatDescription = (desc: string) => {
  const sentences = desc.split(/\.\s+|\.$/).filter(Boolean);
  const immediate: string[] = [];
  const conditional: string[] = [];
  
  sentences.forEach(s => {
    const lower = s.toLowerCase();
    if (
      lower.includes('for each') || 
      lower.includes('for every') || 
      lower.includes('for all') || 
      lower.includes('after') || 
      lower.includes('when built') || 
      lower.includes('placed adjacent')
    ) {
      conditional.push(s);
    } else {
      immediate.push(s);
    }
  });
  return { immediate, conditional };
};

// Track the specific numtags we have assets for
const numtags = new Set([
  'minus1income', 'minus2income', 
  'minus1reputation', 'minus2reputation', 
  'plus1reputation', 'plus2reputation', 'plus3reputation', 
  'plus1income', 'plus2income', 'plus3income', 'plus5income',
  'plus1population', 'plus2population', 'plus3population', 'plus5population',
  'plus6population', 'plus10population'
]);

const renderWithIcons = (text: string) => {
  const regex = /([-+]\s*\d+\s+(?:income|reputation|population)|\b(?:Residential|Commercial|Industrial|Civic|Airport|Dealerships?|Lakes?|Office|Restaurants?|Schools?|Skyscrapers?|Income|Population|Reputation)\b)/gi;
  const parts = text.split(regex);
  
  const map: Record<string, string> = {
    'residential': 'residential',
    'commercial': 'commercial',
    'industrial': 'industrial',
    'civic': 'civic',
    'airport': 'airport',
    'dealership': 'dealership',
    'dealerships': 'dealership',
    'lake': 'lake',
    'lakes': 'lake',
    'office': 'office',
    'restaurant': 'restaurant',
    'restaurants': 'restaurant',
    'school': 'school',
    'schools': 'school',
    'skyscraper': 'skyscraper',
    'skyscrapers': 'skyscraper',
    'income': 'income',
    'population': 'population',
    'reputation': 'reputation'
  };

  return parts.map((part, i) => {
    if (!part) return part;
    const lower = part.toLowerCase();

    // 1. Check if it's a number + stat combination (e.g. "+1 income")
    const numtagMatch = lower.match(/^([-+])\s*(\d+)\s+(income|reputation|population)$/);
    if (numtagMatch) {
      const sign = numtagMatch[1] === '+' ? 'plus' : 'minus';
      const num = numtagMatch[2];
      const stat = numtagMatch[3];
      const fileName = `${sign}${num}${stat}`;

      // If we have an image for this specific combination, render it
      if (numtags.has(fileName)) {
        return (
          <span key={i} className="inline-icon-replacement" title={part}>
            <img src={`/assets/numtags/${fileName}.webp`} alt={part} className="text-inline-icon numtag-icon" />
            <span className="sr-only">{part}</span>
          </span>
        );
      }
      
      // Fallback: If we don't have the combo image (e.g. +4 income), just render the number and the stat icon
      return (
        <span key={i}>
          {numtagMatch[1]}{numtagMatch[2]}{' '}
          <span className="inline-icon-replacement" title={stat}>
            <img src={`/assets/tags/${stat}.webp`} alt={stat} className="text-inline-icon" />
            <span className="sr-only">{stat}</span>
          </span>
        </span>
      );
    }

    // 2. Standard fallback check for single words
    if (map[lower]) {
      return (
        <span key={i} className="inline-icon-replacement" title={part}>
          <img src={`/assets/tags/${map[lower]}.webp`} alt={part} className="text-inline-icon" />
          <span className="sr-only">{part}</span>
        </span>
      );
    }
    
    return part; 
  });
};

const TileTooltip: React.FC<TileTooltipProps> = ({ tile, marketFee, availableCount, y }) => { 
  if (!tile) return null;

  const isMarketTile = typeof marketFee === 'number';
  const totalCost = tile.cost + (marketFee || 0);

  const { immediate, conditional } = formatDescription(tile.description);

  const safeY = Math.max(200, Math.min(y, window.innerHeight - 250));

  return (
    <div 
      className="tile-tooltip-container" 
      style={{ 
        top: safeY, 
        left: '350px', 
        transform: 'translateY(-50%)',
        position: 'fixed' 
      }}
    >
      <div className="tile-tooltip-content tooltip-fade-in">
        <div className="tooltip-header" style={{ backgroundColor: tile.background }}>
          <span>{tile.name}</span>
          
          <div className="tooltip-header-right">
            {tile.type && (
              <img 
                src={`/assets/tags/${tile.type.toLowerCase().replace(/s$/, '')}.webp`} 
                alt={tile.type} 
                className="tooltip-type-icon"
                title={tile.type}
              />
            )}
            {typeof availableCount === 'number' && (
              <span className="tooltip-header-count">x{availableCount}</span>
            )}
          </div>
        </div>
        
        <div className="tooltip-body">
          <div className="tooltip-cost-horizontal">
            <div className="cost-block">
              <span className="cost-label">Base<br/>Cost</span>
              <span className="cost-value">${tile.cost}</span>
            </div>
            
            {isMarketTile && marketFee > 0 && (
              <>
                <div className="cost-operator">+</div>
                <div className="cost-block">
                  <span className="cost-label">Market<br/>Fee</span>
                  <span className="cost-value">${marketFee}</span>
                </div>
                <div className="cost-operator">=</div>
              </>
            )}
            
            <div className="cost-block">
              <span className="cost-label">Total<br/>Cost</span>
              <span className="cost-value total-cost-val">${totalCost}</span>
            </div>
          </div>

          <div className="tooltip-description-split">
            {immediate.length > 0 && (
              <div className="desc-section">
                <div className="desc-label">Immediate Effect:</div>
                <div className="desc-content">{renderWithIcons(immediate.join('. '))}</div>
              </div>
            )}
            {conditional.length > 0 && (
              <div className="desc-section">
                <div className="desc-label">Conditional Effects:</div>
                <div className="desc-content">{renderWithIcons(conditional.join('. '))}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TileTooltip;