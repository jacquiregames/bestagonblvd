// src/components/Market.tsx
import React, { useState } from "react"; 
import { useGameData } from "../context/GameDataContext";
import type { HexTile } from "../types"; 
import TileTooltip from "./TileTooltip"; 
import "../styles/Market.css";

const MARKET_COST_MODIFIERS = [0, 0, 2, 4, 6, 8, 10];

interface MarketProps {
  marketTiles?: (string | null)[];
  basicTiles?: string[];
  selectedTile: { id: string; from: "market" | "basic" } | null;
  onTileSelect: (
    tileId: string,
    from: "market" | "basic",
    index?: number
  ) => void;
  currentPlayer: string;
  myPlayerName: string;
  myCash?: number;
  showOnlyMarket?: boolean;
  showOnlyBasics?: boolean;
  createLakeMode?: boolean;
  onMarketTileSelectForLake?: (index: number) => void;
  isDiscardMode?: boolean;
  basicTileQuantities?: Record<string, number>; 
  isActionPending?: boolean;
}

const Market: React.FC<MarketProps> = ({
  marketTiles = [],
  basicTiles = [],
  selectedTile,
  onTileSelect,
  currentPlayer,
  myPlayerName,
  showOnlyMarket = false,
  showOnlyBasics = false,
  myCash = Infinity,
  createLakeMode = false,
  isDiscardMode = false, 
  basicTileQuantities = {},
  isActionPending = false,
}) => {
  const { tiles } = useGameData();
  const getTileById = (id: string) => tiles[id];

  const [hoveredTile, setHoveredTile] = useState<{
    tile: HexTile;
    marketFee?: number;
    availableCount?: number; 
    y: number;
  } | null>(null);
  
  const isMyTurn = currentPlayer === myPlayerName;

  const renderTile = (
    tile: HexTile,
    from: "market" | "basic",
    index?: number,
    customKey?: string
  ) => {    
    const isLastRoundTile = tile.id === 'ONE_MORE_ROUND';
    const isSelected = selectedTile?.id === tile.id && !createLakeMode && !isDiscardMode;
    const isBasic = from === "basic";
    const isMarket = from === "market";
    const tileSet = tile.set;
    const count = isBasic ? basicTileQuantities[tile.id] : undefined;
    const isSoldOut = isBasic && count === 0;

    let totalCost = tile.cost;
    let marketFee = 0;

    if (isMarket && typeof index === "number") {
      marketFee = MARKET_COST_MODIFIERS[index] ?? 0;
      totalCost += marketFee;
    }
    
    const lakeCost = marketFee;
    const displayCost = isDiscardMode ? marketFee : (createLakeMode ? lakeCost : totalCost);
    const canAfford = isDiscardMode ? myCash >= marketFee : (createLakeMode ? myCash >= lakeCost : myCash >= totalCost);
    const canSelect = isMyTurn && canAfford && !isSoldOut;
    const isLakeSelectable = createLakeMode && isMarket && canSelect;    
    const isLakeDisabled = createLakeMode && isBasic;   
    const isDiscardSelectable = isDiscardMode && isMarket;
    const isNewest = isMarket && index === 6; 
        
    const handleClick = () => {     
      if (isLastRoundTile || isSoldOut || isActionPending) return;
      if (!isMyTurn && !isDiscardMode) return;
      onTileSelect(tile.id, from, index);
    };
     
    const handleMouseEnter = (e: React.MouseEvent) => {
      if (isLastRoundTile) return;
      let fee: number | undefined = undefined;
      if (from === 'market' && typeof index === 'number') {
        fee = MARKET_COST_MODIFIERS[index] ?? 0;
      } 
      setHoveredTile({
        tile: tile,
        marketFee: fee,
        availableCount: count, 
        y: e.clientY,
      });
    };

    const handleMouseLeave = () => {
      setHoveredTile(null);
    };    

    const tileKey = customKey || (isBasic ? `${tile.id}-basic` : `market-tile-${tile.id}`);

    return (
      <button
        key={tileKey}
        className={`market-slot
          ${isSelected ? "selected" : ""}
          ${isNewest ? "new-arrival" : ""} 
          ${canAfford && !createLakeMode && !isDiscardMode ? "affordable" : ""}
          ${isLakeSelectable ? "lake-selectable" : ""}
          ${isDiscardSelectable ? "discard-selectable" : ""}
          ${!isMyTurn && !isDiscardMode ? "disabled" : ""}
          ${isSoldOut ? "sold-out" : ""}
        `}
        onClick={handleClick}
        disabled={isLakeDisabled || isLastRoundTile || isSoldOut || isActionPending} 
        onMouseEnter={handleMouseEnter} 
        onMouseLeave={handleMouseLeave} 
      >
        <div className="tile-wrapper">
          <img src={tile.image} alt={tile.name} /> 
          
          {!isLastRoundTile && <div className="tile-cost">${displayCost}</div>}

          {tileSet && tileSet !== 'basic' && (
            <div className="tile-group">{tileSet}</div>
          )}

          {isBasic && typeof count === 'number' && (
            <div className="tile-quantity-badge">
              x{count}
            </div>
          )}

          {!canAfford && !isDiscardMode && !isSoldOut && (
            <div className="unaffordable-overlay" title={`Need more money`}>
              <span>🖕</span>
            </div>
          )}

          {isDiscardSelectable && (
            <div className="lake-mode-label"> Select to Discard</div>
          )}

          {isLakeSelectable && (
            <div className="lake-mode-label">Select to Convert</div>
          )}
        </div>
      </button>
    );
  };
   
  return (
    <div className="market-container"> 
      {hoveredTile && (
        <TileTooltip 
          tile={hoveredTile.tile} 
          marketFee={hoveredTile.marketFee} 
          availableCount={hoveredTile.availableCount}
          y={hoveredTile.y}
        />
      )} 
      
      {!showOnlyBasics && (
        <div className="market-section market-section-full">
          <div className="market-tiles">
            {marketTiles.map((tileId, index) => {
              if (!tileId) {
                return <div key={`empty-${index}`} className="market-slot empty" />;
              }
              const tile = getTileById(tileId);
              
              const customKey = `market-tile-${index}-${tileId}`;
              
              return tile ? renderTile(tile, "market", index, customKey) : null;
            })}
          </div>
        </div>
      )}

      {!showOnlyMarket && (
        <div className="market-section">
          <div className="market-tiles">
            {basicTiles.map((tileId) => {
              const tile = getTileById(tileId);
              return tile ? renderTile(tile, "basic") : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Market;
