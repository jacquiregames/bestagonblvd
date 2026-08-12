// src/components/GameSummaryPage.tsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { Fireworks } from "@fireworks-js/react";
import type { GameState, Player } from "../types";
import { useGameData } from "../context/GameDataContext";
import "../styles/GameSummaryPage.css";

interface GameSummaryPageProps {
  gameState: GameState;
  onReset: () => void;
  onLiveStatsUpdate: (stats: Record<string, Player>) => void;
}

type SummaryStep =
  | { type: 'START' }
  | { type: 'PUBLIC_HEADER' }
  | { type: 'PUBLIC_GOAL_DETAIL', goalId: string, index: number }
  | { type: 'PRIVATE_HEADER' }
  | { type: 'PRIVATE_GOAL_DETAIL', playerIndex: number }
  | { type: 'CASH_HEADER' }
  | { type: 'CASH_CONVERSION', playerIndex: number }
  | { type: 'WINNER_REVEAL' };

const GameSummaryPage: React.FC<GameSummaryPageProps> = ({ gameState, onLiveStatsUpdate }) => {
  const { goals } = useGameData();

  const [step, setStep] = useState<SummaryStep>({ type: 'START' });
  const [history, setHistory] = useState<React.ReactNode[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [liveStats, setLiveStats] = useState<Record<string, Player>>(() => {
    const initial = { ...gameState.players };
    Object.keys(initial).forEach(id => {
      const p = initial[id];
      let bonusFromPublic = 0;
      (p as any).achievedPublicGoals?.forEach((gid: string) => {
        bonusFromPublic += goals[gid]?.populationBonus || 0;
      });
      const bonusFromPrivate = (p as any).achievedPrivateGoal ? (goals[p.privateGoal!]?.populationBonus || 0) : 0;
      const bonusFromCash = Math.floor(p.money / 5);

      initial[id] = {
        ...p,
        population: p.population - bonusFromPublic - bonusFromPrivate - bonusFromCash
      };
    });
    return initial;
  });

  const addPopulation = (playerId: string, amount: number) => {
    setLiveStats(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        population: prev[playerId].population + amount
      }
    }));
  };

  useEffect(() => {
    onLiveStatsUpdate(liveStats);
  }, [liveStats, onLiveStatsUpdate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, step]);

  // Capture refs for values used inside the async sequence to avoid stale closures
  const gameStateRef = useRef(gameState);
  const goalsRef = useRef(goals);

  useEffect(() => {
    let isMounted = true;
    const gs = gameStateRef.current;
    const gl = goalsRef.current;

    const runSequence = async () => {
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

      await delay(1000);
      if (!isMounted) return;
      setStep({ type: 'PUBLIC_HEADER' });
      setHistory([<h1 key="pub-h" className="summary-section-header slide-in">Public Goals</h1>]);

      for (let i = 0; i < gs.publicGoals.length; i++) {
        const goalId = gs.publicGoals[i];
        const goal = gl[goalId];
        const winners = gs.goalWinners?.[goalId] || [];

        await delay(1500);
        if (!isMounted) return;
        setStep({ type: 'PUBLIC_GOAL_DETAIL', goalId, index: i });

        const goalEntry = (
          <div key={`pub-g-${goalId}`} className="summary-entry public-goal-entry fade-in">
            <div className="goal-header-row">
              <span className="goal-title">{goal.name}</span>
              <span className="goal-objective">{goal.description}</span>
            </div>
            {winners.length === 0 ? (
              <div className="winner-row no-winner">No Unique Winner</div>
            ) : (
              winners.map(wId => (
                <div key={wId} className="public-goal-winner-row bounce-in">
                  <div className="winner-info">
                    <img src={`/assets/colors/${gs.players[wId].color}.png`} className="winner-gem" />
                    <span className="winner-name">{wId}</span>
                  </div>
                  <span className="pop-bonus">
                    <img src="/assets/tags/population.png" /> +{goal.populationBonus}
                  </span>
                </div>
              ))
            )}
          </div>
        );
        setHistory(prev => [...prev, goalEntry]);
        winners.forEach(wId => addPopulation(wId, goal.populationBonus));
      }

      await delay(2000);
      if (!isMounted) return;
      setStep({ type: 'PRIVATE_HEADER' });
      setHistory(prev => [...prev, <h1 key="priv-h" className="summary-section-header slide-in">Private Goals</h1>]);

      for (let i = 0; i < gs.turnOrder.length; i++) {
        const pId = gs.turnOrder[i];
        const player = gs.players[pId];
        const goal = gl[player.privateGoal!];
        const isSuccess = (player as any).achievedPrivateGoal;

        await delay(1500);
        if (!isMounted) return;
        const entry = (
          <div key={`priv-g-${pId}`} className="summary-entry private-goal-entry fade-in">
            <div className="goal-title">{goal.name}</div>
            <div className="goal-objective">{goal.description}</div>
            <div className="player-goal-result-row">
              <div className="player-context">
                <img src={`/assets/colors/${player.color}.png`} className="winner-gem" />
                <span>{pId}</span>
              </div>
              <div className={`goal-result ${isSuccess ? 'success' : 'fail'}`}>
                {isSuccess ? '' : 'FAIL'}
                {isSuccess && (
                  <span className="pop-bonus">
                    <img src="/assets/tags/population.png" /> +{goal.populationBonus}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
        setHistory(prev => [...prev, entry]);
        if (isSuccess) addPopulation(pId, goal.populationBonus);
      }

      await delay(2000);
      if (!isMounted) return;
      setStep({ type: 'CASH_HEADER' });
      setHistory(prev => [...prev, <h1 key="cash-h" className="summary-section-header slide-in">Cash Conversion</h1>]);

      for (let i = 0; i < gs.turnOrder.length; i++) {
        const pId = gs.turnOrder[i];
        const player = gs.players[pId];
        const bonus = Math.floor(player.money / 5);

        await delay(1200);
        if (!isMounted) return;

        const entry = (
          <div key={`cash-${pId}`} className="summary-entry cash-entry fade-in">
            <div className="conversion-row">
              <div className="winner-info">
                <img src={`/assets/colors/${player.color}.png`} className="winner-gem" />
                <span className="winner-name">{pId}</span>
              </div>
              <div className="conversion-details">
                <span className="cash-val">
                  <img src="/assets/tags/money.png" /> {player.money}
                </span>
                <span className="arrow">
                  <img src="/assets/tags/arrow.png" alt="arrow" />
                </span>
                <span className="pop-bonus">
                  <img src="/assets/tags/population.png" /> +{bonus}
                </span>
              </div>
            </div>
          </div>
        );
        setHistory(prev => [...prev, entry]);
        addPopulation(pId, bonus);
      }

      await delay(2000);
      if (!isMounted) return;
      setStep({ type: 'WINNER_REVEAL' });
    };

    runSequence();
    return () => {
      isMounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // FIX: use liveStats (which has accumulated goal/cash bonuses) for the final ranking,
  // not gameState.players which reflects the server state before the summary animation.
  const winnersList = useMemo(() => {
    const sorted = Object.values(liveStats).sort((a, b) => b.population - a.population);
    if (sorted.length === 0) return [];
    const topScore = sorted[0].population;
    return sorted.filter(p => p.population === topScore);
  }, [liveStats]);

  return (
    <div className="summary-overlay">
      {step.type === 'WINNER_REVEAL' && (
        <Fireworks
          options={{ opacity: 0.5 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1001,
            pointerEvents: 'none'
          }}
        />
      )}

      <div className="summary-container-v2" ref={scrollRef}>
        <div className="summary-scroll-content">
          {history}

          {step.type === 'WINNER_REVEAL' && winnersList.length > 0 && (
            <div className="winner-container scale-up">
              <div className="winner-label">WINNER</div>
              {winnersList.map(w => (
                <div key={w.id} className="final-winner-name">
                  {w.name}
                </div>
              ))}
              <div className="final-pop">{winnersList[0].population} Population</div>
            </div>
          )}
        </div>
      </div>
      {/* FIX: removed empty inline <style> block that was a leftover stub */}
    </div>
  );
};

export default GameSummaryPage;
