// src/components/GameBoard.tsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import type { PlacedTile, HexTile } from "../types";
import { useGameData } from "../context/GameDataContext";
import "../styles/GameBoard.css";

interface GameBoardProps {
  placedTiles?: PlacedTile[];
  onHexClick?: (q: number, r: number) => void;
  validPlacements?: { q: number; r: number }[];
  recentlyPlaced?: { q: number; r: number } | null;
  zoom: number;
  highlightedStat: string | null;
  viewingPlayerColor?: string;
  oneMoreRoundDrawn: boolean;
  centerCameraCounter?: number;
}

const HEX_WIDTH = 160;
const HEX_HEIGHT = HEX_WIDTH * 0.866;

function axialToPixel(q: number, r: number) {
  const x = HEX_WIDTH * (3 / 4) * q;
  const y = HEX_HEIGHT * (r + q / 2);
  return { x, y };
}

const topRow = [
  { q: -1, r: 2 },
  { q: 0, r: 2 },
  { q: 1, r: 1 },
  { q: 2, r: 1 },
  { q: 3, r: 0 },
  { q: 4, r: 0 },
  { q: 5, r: -1 },
  { q: 6, r: -1 },
  { q: 7, r: -2 },
];

const shouldHighlight = (
  tile: PlacedTile,
  tileData: HexTile,
  highlightedStat: string | null
): boolean => {
  if (!highlightedStat) return false;
  if (highlightedStat === "Lake") return tile.isLake;
  if (!tileData) return false;
  return tileData.category === highlightedStat || tileData.type === highlightedStat;
};

// FIX: each fish entry now carries a unique instanceId so that hiding one fish
// by src won't accidentally remove a different fish with the same src from another cycle.
interface FishConfig {
  q: number;
  r: number;
  src: string;
  delay: number;
  visibleTime: number;
}

interface ActiveFish {
  instanceId: number;
  q: number;
  r: number;
  src: string;
}

const fishPositions: FishConfig[] = [
  { q: 0, r: 2, src: "/assets/fish/fish5.png", delay: 15000, visibleTime: 4500 },
  { q: 2, r: 1, src: "/assets/fish/fish6.png", delay: 30000, visibleTime: 5000 },
  { q: 4, r: 0, src: "/assets/fish/fish7.png", delay: 45000, visibleTime: 12200 },
  { q: 6, r: -1, src: "/assets/fish/fish8.png", delay: 60000, visibleTime: 9000 },
  { q: 0, r: 2, src: "/assets/fish/fish1.png", delay: 74000, visibleTime: 4000 },
  { q: 2, r: 1, src: "/assets/fish/fish2.png", delay: 89000, visibleTime: 5300 },
  { q: 4, r: 0, src: "/assets/fish/fish3.png", delay: 104000, visibleTime: 3300 },
  { q: 6, r: -1, src: "/assets/fish/fish4.png", delay: 119000, visibleTime: 10000 },
  { q: 0, r: 2, src: "/assets/fish/fish9.png", delay: 134000, visibleTime: 10000 },
  { q: 2, r: 1, src: "/assets/fish/fish10.png", delay: 149000, visibleTime: 4000 },
  { q: 4, r: 0, src: "/assets/fish/fish11.png", delay: 164000, visibleTime: 8000 },
  { q: 6, r: -1, src: "/assets/fish/fish12.png", delay: 179000, visibleTime: 4300 },
];

let fishInstanceCounter = 0;

const GameBoard: React.FC<GameBoardProps> = ({
  placedTiles = [],
  onHexClick,
  validPlacements = [],
  recentlyPlaced = null,
  zoom,
  highlightedStat,
  viewingPlayerColor,
  oneMoreRoundDrawn = false,
  centerCameraCounter = 0,
}) => {
  const { tiles } = useGameData();
  const getTileById = (id: string) => tiles[id];

  const safeTiles = useMemo(
    () => placedTiles.filter((t) => typeof t.q === "number" && typeof t.r === "number"),
    [placedTiles]
  );

  const occupiedSet = useMemo(
    () => new Set(safeTiles.map((t) => `${t.q},${t.r}`)),
    [safeTiles]
  );

  const validSet = useMemo(
    () => new Set(validPlacements.map((p) => `${p.q},${p.r}`)),
    [validPlacements]
  );

  const topRowSet = useMemo(
    () => new Set(topRow.map((t) => `${t.q},${t.r}`)),
    []
  );

  const { minX, minY, maxX, maxY, coordArray } = useMemo(() => {
    const allCoords = new Set<string>();

    [...safeTiles, ...validPlacements, ...topRow].forEach((t) => {
      allCoords.add(`${t.q},${t.r}`);
      const neighbors = [
        { q: t.q + 1, r: t.r },
        { q: t.q - 1, r: t.r },
        { q: t.q, r: t.r + 1 },
        { q: t.q, r: t.r - 1 },
        { q: t.q + 1, r: t.r - 1 },
        { q: t.q - 1, r: t.r + 1 },
      ];
      neighbors.forEach((n) => allCoords.add(`${n.q},${n.r}`));
    });

    const coords = Array.from(allCoords).map((key) => {
      const [q, r] = key.split(",").map(Number);
      return { q, r };
    });

    if (coords.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, coordArray: [] };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const c of coords) {
      const { x, y } = axialToPixel(c.q, c.r);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    return { minX, minY, maxX, maxY, coordArray: coords };
  }, [safeTiles, validPlacements]);

  const boardWidth = maxX - minX + HEX_WIDTH;
  const boardHeight = maxY - minY + HEX_HEIGHT;

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (centerCameraCounter > 0) {
      setDragOffset({ x: 0, y: 0 });  
    }
  }, [centerCameraCounter]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return; 
    const dx = (e.clientX - dragStart.current.x) / zoom;
    const dy = (e.clientY - dragStart.current.y) / zoom;
    setDragOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    dragStart.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseUp = () => setIsDragging(false);

  const [visibleFish, setVisibleFish] = useState<ActiveFish[]>([]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const intervals: ReturnType<typeof setInterval>[] = [];

    const startFishCycle = () => {
      fishPositions.forEach(({ q, r, src, delay, visibleTime }) => {
        const timer = setTimeout(() => {
          const instanceId = ++fishInstanceCounter;
          setVisibleFish((prev) => [...prev, { instanceId, q, r, src }]);

          const hideTimer = setTimeout(() => {
            setVisibleFish((prev) => prev.filter((f) => f.instanceId !== instanceId));
          }, visibleTime);
          timers.push(hideTimer);
        }, delay);
        timers.push(timer);
      });
    };

    startFishCycle();
    const masterInterval = setInterval(startFishCycle, 200000);
    intervals.push(masterInterval);

    return () => {
      timers.forEach(clearTimeout);
      intervals.forEach(clearInterval);
    };
  }, []);

  return (
    <div
      className="board-zoom-wrapper"
      style={{ "--zoom-scale": zoom } as React.CSSProperties}
    >
      <div
        className="game-board-container"
        style={{
          width: boardWidth,
          height: boardHeight,
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}  // FIX: prevent drag-stick when cursor leaves board
      >
        {coordArray.map(({ q, r }) => {
          const key = `${q},${r}`;
          const isOccupied = occupiedSet.has(key);
          const isValid = validSet.has(key);
          const isTop = topRowSet.has(key);
          const isOMRHex = q === 4 && r === 0;
          const { x, y } = axialToPixel(q, r);

          if (!isOccupied && !isValid && !isTop) return null;
          if (isOccupied && !isTop && !isValid) return null;

          let className = "hex";
          let innerStyle: React.CSSProperties = {};

          if (isTop) {
            className += " blue-border-hex";
            if (isOMRHex && oneMoreRoundDrawn) {
              className += " has-omr one-more-round-active";
            } else {
              const topRowIndex = topRow.findIndex((pos) => pos.q === q && pos.r === r);
              if (topRowIndex !== -1) {
                innerStyle.backgroundPosition = `-${topRowIndex * HEX_WIDTH}px 0`;
              }
            }
          } else if (isValid) {
            className += " valid-placement-hex";
          } else {
            className += " empty-hex";
          }

          const handleClick = () => {
            if (!isTop) onHexClick?.(q, r);
          };

          return (
            <div
              key={`bg-${key}`}
              className={className}
              style={{ left: x - minX, top: y - minY }}
              onClick={handleClick}
            >
              <div className="hex-inner" style={innerStyle}>
                <div className="hex-content">
                  {visibleFish
                    .filter((f) => f.q === q && f.r === r)
                    .map((f) => (
                      <img
                        key={f.instanceId}
                        src={f.src}
                        alt="fish"
                        className="fish-gif"
                      />
                    ))
                  }
                </div>
              </div>
            </div>
          );
        })}

        {safeTiles.map((tile) => {
          const { x, y } = axialToPixel(tile.q, tile.r);
          const tileData = getTileById(tile.originalTileId || tile.tileId);
          const isRecent = recentlyPlaced?.q === tile.q && recentlyPlaced?.r === tile.r;
          const isHighlighted = tileData
            ? shouldHighlight(tile, tileData, highlightedStat)
            : false;

          let className = `hex ${isHighlighted ? "highlighted-hex" : ""}`;
          let innerStyle: React.CSSProperties = {};

          if (tile.isLake) {
            className += " lake-hex";
            const tileSet = tileData?.set?.toLowerCase();
            if (tileSet && ["a", "b", "c"].includes(tileSet)) {
              className += ` lake-hex-${tileSet}`;
            }
          } else {
            className += " tile-hex";
            if (tileData?.image) {
              innerStyle.backgroundImage = `url(${tileData.image})`;
            }
          }

          return (
            <div
              key={`tile-${tile.q}-${tile.r}`}
              className={`${className} ${isRecent ? "entering" : ""}`}
              style={{ left: x - minX, top: y - minY }}
              onClick={() => onHexClick?.(tile.q, tile.r)}
            >
              <div className="hex-inner" style={innerStyle}>
                <div className="hex-content">
                  {tile.hasInvestment && (
                    <>
                      {viewingPlayerColor && (
                        <img
                          src={`/assets/components/invest_${viewingPlayerColor}.png`}
                          className="investment-marker-image"
                          alt="Investment Marker"
                        />
                      )}
                      <span className="investment-marker-text">💰</span>
                    </>
                  )}
                  <span>
                    {tile.q},{tile.r}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GameBoard;
