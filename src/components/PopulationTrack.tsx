// src/components/PopulationTrack.tsx
import React, { useMemo, useState, useRef, useLayoutEffect } from "react";
import "../styles/PopulationTrack.css";
import type { Player } from "../types";  

interface Props {
  players: Record<string, Player>;
}

const RED_LINES = new Set([14, 21, 28, 34, 40, 46, 52, 58, 63, 68, 73, 77, 81, 85, 88, 91, 94, 97, 100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120, 122, 124, 126, 128, 130, 132, 134, 136, 138, 140, 142, 144, 146, 148, 150]);
const RedLineBorderTop = new Set([14, 21, 28, 35, 41, 47, 53, 59, 63, 68, 73, 77, 81, 85, 88, 92, 95, 98, 101, 103, 105, 107, 109, 111, 113, 115, 117, 119, 120, 122, 124, 126, 128, 130, 132, 134, 136, 138, 140, 142, 144, 146, 148, 150]);
const RedLineBorderBottom = new Set([15, 22, 29, 34, 40, 46, 52, 58, 64, 69, 74, 78, 82, 86, 89, 91, 94, 97, 100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 121, 123, 125, 127, 129, 131, 133, 135, 137, 139, 141, 143, 145, 147, 149]);
const ROWS: Array<Array<number | null>> = [
  [150, null, null, null, null],
  [ 29 , 30 , 89 ,  90, 149],
  [ 28 , 31 , 88 ,  91, 148],
  [ 27 , 32 , 87 ,  92, 147],
  [ 26 , 33 , 86 ,  93, 146],
  [ 25 , 34 , 85 ,  94, 145],
  [ 24 , 35 , 84 ,  95, 144],
  [ 23 , 36 , 83 ,  96, 143],
  [ 22 , 37 , 82 ,  97, 142],
  [ 21 , 38 , 81 ,  98, 141],
  [ 20 , 39 , 80 ,  99, 140],
  [ 19 , 40 , 79 , 100, 139],
  [ 18 , 41 , 78 , 101, 138],
  [ 17 , 42 , 77 , 102, 137],
  [ 16 , 43 , 76 , 103, 136],
  [ 15 , 44 , 75 , 104, 135],
  [ 14 , 45 , 74 , 105, 134],
  [ 13 , 46 , 73 , 106, 133],
  [ 12 , 47 , 72 , 107, 132],
  [ 11 , 48 , 71 , 108, 131],
  [ 10 , 49 , 70 , 109, 130],
  [ 9  , 50 , 69 , 110, 129],
  [ 8  , 51 , 68 , 111, 128],
  [ 7  , 52 , 67 , 112, 127],
  [ 6  , 53 , 66 , 113, 126],
  [ 5  , 54 , 65 , 114, 125],
  [ 4  , 55 , 64 , 115, 124],
  [ 3  , 56 , 63 , 116, 123],
  [ 2  , 57 , 62 , 117, 122],
  [ 1  , 58 , 61 , 118, 121],
  [ 0  , 59 , 60 , 119, 120],
];

const MARKER_SIZE = 18; // Corresponds to the width/height of .player-marker

const PopulationTrack: React.FC<Props> = ({ players }) => {
  const playersByPop = useMemo(() => {
    const map = new Map<number, Player[]>();
    for (const player of Object.values(players)) {
      // Clamp the visual rendering so markers don't vanish if they exceed 150 or drop below 0
      const displayPop = Math.min(150, Math.max(0, player.population));
      if (!map.has(displayPop)) {
        map.set(displayPop, []);
      }
      map.get(displayPop)!.push(player);
    }
    return map;
  }, [players]);

  // FIX: State to store the calculated coordinates of each population cell
  const [cellCoords, setCellCoords] = useState<Map<number, { top: number; left: number; width: number; height: number; }>>(new Map());
  const gridRef = useRef<HTMLDivElement>(null);

  // Tracks which players just changed population so we can briefly apply
  // .just-moved (marker-bounce, 0.3s) to their marker.
  const [justMovedIds, setJustMovedIds] = useState<Set<string>>(new Set());
  const prevPopulationsRef = useRef<Map<string, number>>(new Map());

  useLayoutEffect(() => {
    const prevPopulations = prevPopulationsRef.current;
    const movedIds = new Set<string>();

    for (const player of Object.values(players)) {
      const prevPop = prevPopulations.get(player.id);
      if (prevPop !== undefined && prevPop !== player.population) {
        movedIds.add(player.id);
      }
    }

    if (movedIds.size > 0) {
      setJustMovedIds(movedIds);
      // NOTE: 300ms matches the marker-bounce animation duration (0.3s)
      // in PopulationTrack.css. Keep these in sync if either value changes.
      const timer = setTimeout(() => setJustMovedIds(new Set()), 300);
      prevPopulationsRef.current = new Map(
        Object.values(players).map(p => [p.id, p.population])
      );
      return () => clearTimeout(timer);
    }

    prevPopulationsRef.current = new Map(
      Object.values(players).map(p => [p.id, p.population])
    );
  }, [players]);

  // FIX: useLayoutEffect runs after the DOM is painted, so we can measure elements
  useLayoutEffect(() => {
    if (!gridRef.current) return;

    const newCoords = new Map<number, { top: number; left: number; width: number; height: number; }>();
    const gridRect = gridRef.current.getBoundingClientRect();
    const cells = gridRef.current.querySelectorAll('[data-pop]');

    cells.forEach(cell => {
      const popValue = parseInt(cell.getAttribute('data-pop')!, 10);
      const cellRect = cell.getBoundingClientRect();
      // Calculate position relative to the grid container
      newCoords.set(popValue, {
        top: cellRect.top - gridRect.top,
        left: cellRect.left - gridRect.left,
        width: cellRect.width,
        height: cellRect.height,
      });
    });

    setCellCoords(newCoords);
  }, [players]); // Re-calculate if the number of players changes (in case layout shifts)

  return (
    <div className="pop-grid" ref={gridRef}>
      {/* --- Part 1: Render the static background grid --- */}
      {ROWS.map((row, rowIndex) => (
        <div key={`r-${rowIndex}`} className="pop-row">
          {rowIndex === 0 ? (
            /* ADDED 'finish-line' class here */
            <div className="pop-cell pop-cell-full-width milestone-number finish-line" data-pop={row[0]}>
              🏆 {row[0]} 🏆
            </div>
          ) : (
            row.map((num, col) => {
              if (num === null) {
                return <div key={`c-${rowIndex}-${col}`} className="pop-cell empty" />;
              }

              const cellClasses = ["pop-cell"];
              if (RedLineBorderTop.has(num)) cellClasses.push("red-line");
              if (RedLineBorderBottom.has(num)) cellClasses.push("red-line-predecessor");
              if (RED_LINES.has(num)) cellClasses.push("milestone-number");

              return (
                <div key={`c-${rowIndex}-${col}`} className={cellClasses.join(" ")} data-pop={num}>
                  {num}
                </div>
              );
            })
          )}
        </div>
      ))}
      
      {/* --- Part 2: Render the absolutely positioned, animated markers --- */}
      {Object.values(players).map(player => {
        // Find the safely clamped coordinate for drawing
        const displayPop = Math.min(150, Math.max(0, player.population));
        const coords = cellCoords.get(displayPop);
        if (!coords) return null; // Don't render if we haven't measured the cell yet

        const playersOnCell = playersByPop.get(displayPop) || [];
        const playerIndex = playersOnCell.findIndex(p => p.id === player.id);
        const totalOnCell = playersOnCell.length;
        
        // Simple offset logic to prevent markers from perfectly overlapping
        let offsetX = 0;
        if (totalOnCell > 1) {
          const spacing = 6; // pixels
          offsetX = (playerIndex * spacing) - ((totalOnCell - 1) * spacing / 2);
        }

        const markerStyle: React.CSSProperties = {
          backgroundColor: player.color,
          top: `${coords.top + (coords.height / 2) - (MARKER_SIZE / 2)}px`,
          left: `${coords.left + (coords.width / 2) - (MARKER_SIZE / 2)}px`,
          transform: `translateX(var(--offset-x, 0px))`,
          // FIX: expose the offset as a CSS variable rather than baking it
          // directly into `transform`, since marker-bounce also animates
          // `transform` and would otherwise clobber this horizontal offset.
          ['--offset-x' as any]: `${offsetX}px`,
        };

        return (
          <div 
            key={player.id} 
            className={`player-marker${justMovedIds.has(player.id) ? ' just-moved' : ''}`}
            style={markerStyle} 
            // Add the player's true population to the tooltip so it can be seen if > 150
            title={`${player.name} (${player.population})`} 
          />
        );
      })}
    </div>
  );
};

export default PopulationTrack;
