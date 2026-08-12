// src/components/PlayersDisplay.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Player, GameState, PlacedTile, HexTile } from '../types';
import { useGameData } from '../context/GameDataContext';
import '../styles/PlayersDisplay.css';
import AnimatedStat from './AnimatedStat';

interface StatChange {
  id: number;
  playerId: string;
  statKey: string;
  change: number;
}

const dataRows = [
  { type: 'image', value: '/assets/tags/population.png', alt: 'Population', statKey: 'population' },
  { type: 'image', value: '/assets/tags/money.png', alt: 'Money', statKey: 'money' },
  { type: 'image', value: '/assets/tags/income.png', alt: 'Income', statKey: 'income' },
  { type: 'image', value: '/assets/tags/reputation.png', alt: 'Reputation', statKey: 'reputation' },
  { type: 'image', value: '/assets/tags/investments.png', alt: 'Investments', statKey: 'investmentMarkers' },
  { type: 'image', value: '/assets/tags/lake.png', alt: 'Lakes', statKey: 'Lake' },
  { type: 'image', value: '/assets/tags/residential.png', alt: 'Residential', statKey: 'Residential' },
  { type: 'image', value: '/assets/tags/civic.png', alt: 'Civic', statKey: 'Civic' },
  { type: 'image', value: '/assets/tags/school.png', alt: 'School', statKey: 'School' },
  { type: 'image', value: '/assets/tags/industrial.png', alt: 'Industrial', statKey: 'Industrial' },
  { type: 'image', value: '/assets/tags/airport.png', alt: 'Airport', statKey: 'Airport' },
  { type: 'image', value: '/assets/tags/commercial.png', alt: 'Commercial', statKey: 'Commercial' },
  { type: 'image', value: '/assets/tags/office.png', alt: 'Office', statKey: 'Office' },
  { type: 'image', value: '/assets/tags/restaurant.png', alt: 'Restaurant', statKey: 'Restaurant' },
  { type: 'image', value: '/assets/tags/skyscraper.png', alt: 'Skyscraper', statKey: 'Skyscraper' },
  { type: 'image', value: '/assets/tags/dealership.png', alt: 'Dealership', statKey: 'Dealership' },
];

const PLAYER_STAT_KEYS = new Set(['money', 'income', 'reputation', 'population', 'investmentMarkers']);

const getColorImage = (color: string) => `/assets/colors/${color}.png`;

const countTiles = (board: PlacedTile[], statKey: string, tiles: Record<string, HexTile>): number => {
  if (!board) return 0;
  if (statKey === 'Lake') return board.filter(tile => tile.isLake).length;

  const categories = ['Civic', 'Commercial', 'Industrial', 'Residential'];
  const types = ['Office', 'Restaurant', 'School', 'Airport', 'Skyscraper', 'Dealership'];

  return board.reduce((count, placedTile) => {
    if (placedTile.isLake) return count;
    const tileData = tiles[placedTile.tileId];
    if (!tileData) return count;

    if (categories.includes(statKey) && tileData.category === statKey) return count + 1;
    if (types.includes(statKey) && tileData.type === statKey) return count + 1;
    return count;
  }, 0);
};

interface PlayersDisplayProps {
  players: Record<string, Player>;
  turnOrder: string[];
  playerBoards: GameState['playerBoards'];
  currentPlayerId: string | null;
  onPlayerView: (playerId: string) => void;
  onStatClick: (playerId: string, stat: 'income' | 'reputation' | 'population') => void;
  highlightedStat: string | null;
  onStatHighlight: (statKey: string | null) => void;
  onStatMouseLeave: () => void;
}

const PlayersDisplay: React.FC<PlayersDisplayProps> = ({
  players,
  turnOrder,
  playerBoards,
  currentPlayerId,
  onPlayerView,
  onStatClick,
  highlightedStat,
  onStatHighlight,
  onStatMouseLeave,
}) => {
  const { tiles } = useGameData();

  // FIX: memoize so it isn't recomputed on every render
  const orderedPlayers = useMemo(
    () => turnOrder.map(id => players[id]).filter(Boolean),
    [turnOrder, players]
  );

  const [statChanges, setStatChanges] = useState<StatChange[]>([]);
  const [changedCells, setChangedCells] = useState<Set<string>>(new Set());
  const prevPlayersRef = useRef<Record<string, Player>>(players);
  const prevBoardsRef = useRef<GameState['playerBoards']>(playerBoards);

  // FIX: Merged the two separate useEffects into one pass to avoid double iteration
  // and the race condition where prevPlayersRef was updated between them.
  useEffect(() => {
    const prevPlayers = prevPlayersRef.current;
    const prevBoards = prevBoardsRef.current;

    const newFloats: StatChange[] = [];
    const newHighlights = new Set<string>();

    for (const player of orderedPlayers) {
      const prevPlayer = prevPlayers[player.id];
      if (!prevPlayer) continue;

      for (const { statKey } of dataRows) {
        let oldValue: number;
        let newValue: number;

        if (PLAYER_STAT_KEYS.has(statKey)) {
          oldValue = prevPlayer[statKey as keyof Player] as number;
          newValue = player[statKey as keyof Player] as number;
        } else {
          // Board-derived stats: compare against previous board snapshot
          const prevBoard = prevBoards[player.id] ?? [];
          oldValue = countTiles(prevBoard, statKey, tiles);
          newValue = countTiles(playerBoards[player.id], statKey, tiles);
        }

        const diff = newValue - oldValue;
        if (diff !== 0) {
          newHighlights.add(`${player.id}-${statKey}`);

          // Only queue float animations for numeric player stats
          if (PLAYER_STAT_KEYS.has(statKey)) {
            newFloats.push({
              id: Date.now() + Math.random(),
              playerId: player.id,
              statKey,
              change: diff,
            });
          }
        }
      }
    }

    if (newFloats.length > 0) {
      setStatChanges(current => [...current, ...newFloats]);
      const ids = new Set(newFloats.map(f => f.id));
      // NOTE: 2000ms matches the .stat-change-float animation duration
      // (float-and-fade, 2s) in PlayersDisplay.css. Keep these in sync
      // if either value changes.
      setTimeout(() => {
        setStatChanges(current => current.filter(c => !ids.has(c.id)));
      }, 2000);
    }

    if (newHighlights.size > 0) {
      setChangedCells(newHighlights);
      setTimeout(() => setChangedCells(new Set()), 1000);
    }

    // Update refs AFTER comparisons are done
    prevPlayersRef.current = players;
    prevBoardsRef.current = playerBoards;
  }, [players, playerBoards, orderedPlayers, tiles]);

  return (
    <div className="players-display-container">
      <table className="players-display-table">
        <thead>
          <tr>
            <th></th>
            {orderedPlayers.map(player => (
              <th
                key={player.id}
                className={player.id === currentPlayerId ? 'current-player-header' : ''}
                style={{ cursor: 'pointer' }}
                onClick={() => onPlayerView(player.id)}
                title={`Click to view ${player.name}'s board`}
              >
                <div className="player-header-cell">
                  <img src={getColorImage(player.color)} alt={player.color} className="player-header-icon" />
                  <span className="player-header-name">
                    {player.name.slice(0, 5)}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, rowIndex) => {
            const isHighlighted = highlightedStat === row.statKey;
            return (
              <tr
                key={rowIndex}
                className={isHighlighted ? 'highlighted-row' : ''}
              >
                <td className="players-display-label-cell">
                  <span>{row.alt}</span>
                  {row.type === 'image' ? (
                    <img src={row.value} alt={row.alt} className="players-display-icon" />
                  ) : (
                    <span className="players-display-emoji">{row.value}</span>
                  )}
                </td>
                {orderedPlayers.map(player => {
                  // FIX: typed as number instead of any
                  let value: number = 0;
                  const isBreakdownStat = ['income', 'reputation', 'population'].includes(row.statKey);

                  if (PLAYER_STAT_KEYS.has(row.statKey)) {
                    value = player[row.statKey as keyof Player] as number;
                  } else {
                    value = countTiles(playerBoards[player.id], row.statKey, tiles);
                  }

                  return (
                    <td
                      key={player.id}
                      className={`players-display-value-cell ${changedCells.has(`${player.id}-${row.statKey}`) ? 'recently-changed' : ''}`}
                      onClick={() => onStatHighlight(isHighlighted ? null : row.statKey)}
                      onMouseEnter={() => {
                        if (isBreakdownStat) {
                          onStatClick(player.id, row.statKey as 'income' | 'reputation' | 'population');
                        }
                      }}
                      onMouseLeave={() => {
                        if (isBreakdownStat) onStatMouseLeave();
                      }}
                      title={isBreakdownStat ? `Hover for ${row.alt} breakdown` : `Click to highlight ${row.alt}`}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      <AnimatedStat value={value} />
                      {statChanges.map(change =>
                        change.playerId === player.id && change.statKey === row.statKey ? (
                          <span
                            key={change.id}
                            className={`stat-change-float ${change.change > 0 ? 'gain' : 'loss'} ${change.statKey}`}
                          >
                            {change.change > 0 ? `+${change.change}` : change.change}
                          </span>
                        ) : null
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PlayersDisplay;

