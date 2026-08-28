// src/components/OpponentBoardsFooter.tsx
import React, { useMemo } from "react";
import type { Player, PlacedTile } from "../types";
import { useGameData } from "../context/GameDataContext";
import "../styles/OpponentBoardsFooter.css";

// Deliberately tiny — this is a glanceable minimap, not a second playable
// board, so it intentionally skips everything GameBoard.tsx does for the
// real board (drag-to-pan, fish, valid-placement highlighting, etc.).
const MINI_HEX_WIDTH = 16;
const MINI_HEX_HEIGHT = MINI_HEX_WIDTH * 0.866;

function axialToPixel(q: number, r: number) {
  const x = MINI_HEX_WIDTH * (3 / 4) * q;
  const y = MINI_HEX_HEIGHT * (r + q / 2);
  return { x, y };
}

interface MiniBoardCardProps {
  player: Player;
  board: PlacedTile[];
  isViewing: boolean;
  onSelect: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

// Fixed thumbnail viewport size — every mini board is scaled to fit inside
// this box (rather than rendered 1:1 and cropped), so a 3-tile starting
// board and a sprawling 40-tile late-game board are both fully visible.
const VIEWPORT_WIDTH = 120;
const VIEWPORT_HEIGHT = 90;
const MAX_FIT_SCALE = 3.5; // cap how much a tiny (e.g. starting) board gets blown up

const MiniBoardCard: React.FC<MiniBoardCardProps> = ({ player, board, isViewing, onSelect, onHoverStart, onHoverEnd }) => {
  const { tiles } = useGameData();

  const { positionedTiles, canvasWidth, canvasHeight, fitScale } = useMemo(() => {
    const safeTiles = board.filter((t) => typeof t.q === "number" && typeof t.r === "number");

    if (safeTiles.length === 0) {
      return {
        positionedTiles: [] as { tile: PlacedTile; x: number; y: number }[],
        canvasWidth: MINI_HEX_WIDTH,
        canvasHeight: MINI_HEX_HEIGHT,
        fitScale: 1,
      };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const raw = safeTiles.map((tile) => {
      const { x, y } = axialToPixel(tile.q, tile.r);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      return { tile, x, y };
    });

    const width = maxX - minX + MINI_HEX_WIDTH;
    const height = maxY - minY + MINI_HEX_HEIGHT;
    const scale = Math.min(VIEWPORT_WIDTH / width, VIEWPORT_HEIGHT / height, MAX_FIT_SCALE);

    return {
      positionedTiles: raw.map(({ tile, x, y }) => ({ tile, x: x - minX, y: y - minY })),
      canvasWidth: width,
      canvasHeight: height,
      fitScale: scale,
    };
  }, [board]);

  return (
    <button
      type="button"
      className={`opponent-mini-board-card ${isViewing ? "is-viewing" : ""}`}
      style={{ "--player-color": player.color } as React.CSSProperties}
      onClick={onSelect}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      title={`View ${player.name}'s board`}
    >
      <div className="opponent-mini-board-header">
        <span className="opponent-mini-board-name">{player.name}</span>
        <span className="opponent-mini-board-pop">👤{player.population}</span>
      </div>
      <div className="opponent-mini-board-viewport" style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}>
        <div
          className="opponent-mini-board-canvas"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `translate(-50%, -50%) scale(${fitScale})`,
          }}
        >
          {positionedTiles.map(({ tile, x, y }) => {
            const tileData = tiles[tile.originalTileId || tile.tileId];
            let className = "hex mini-hex";
            const innerStyle: React.CSSProperties = {};

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
              <div key={`${tile.q},${tile.r}`} className={className} style={{ left: x, top: y }}>
                <div className="hex-inner" style={innerStyle} />
              </div>
            );
          })}
        </div>
      </div>
    </button>
  );
};

interface OpponentBoardsFooterProps {
  players: Record<string, Player>;
  playerBoards: Record<string, PlacedTile[]>;
  turnOrder: string[];
  myPlayerName: string;
  viewingPlayerName: string;
  onSelectPlayer: (name: string) => void;
  onHoverPlayer: (name: string | null) => void;
}

const OpponentBoardsFooter: React.FC<OpponentBoardsFooterProps> = ({
  players,
  playerBoards,
  turnOrder,
  myPlayerName,
  viewingPlayerName,
  onSelectPlayer,
  onHoverPlayer,
}) => {
  // Every other player, in turn order — so with 4 players there are 3 mini
  // boards, with 2 players there's 1, and it's stable across turns rather
  // than reordering as the current turn changes.
  const opponentNames = (turnOrder.length > 0 ? turnOrder : Object.keys(players)).filter(
    (name) => name !== myPlayerName && players[name]
  );

  if (opponentNames.length === 0) return null;

  return (
    <div className="opponent-boards-footer">
      {opponentNames.map((name) => (
        <MiniBoardCard
          key={name}
          player={players[name]}
          board={playerBoards[name] || []}
          isViewing={viewingPlayerName === name}
          onSelect={() => onSelectPlayer(name)}
          onHoverStart={() => onHoverPlayer(name)}
          onHoverEnd={() => onHoverPlayer(null)}
        />
      ))}
    </div>
  );
};

export default OpponentBoardsFooter;
