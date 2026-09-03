// src/App.tsx
import React, { useCallback } from "react"; 
import { api, WS_URL, getErrorMessage } from "./services/api";
import useWebSocketWithReconnect from "./hooks/useWebSocketWithReconnect";
import { useGameStateSync } from "./hooks/useGameStateSync";
import { useGameActions } from "./hooks/useGameActions";
import { useGameDataFetcher } from "./hooks/useGameDataFetcher";
import { useAutoClearErrors } from "./hooks/useAutoClearErrors";
import { useTurnBanner } from "./hooks/useTurnBanner";
import { useDerivedGameState } from "./hooks/useDerivedGameState";
import { useGameUI } from "./hooks/useGameUI";
import { useGameSession } from "./hooks/useGameSession";
import { GameDataProvider } from "./context/GameDataContext";

import UnifiedIntro from "./components/UnifiedIntro";
import ImagePreloader from "./components/ImagePreloader";
import LoadingScreen from "./components/LoadingScreen";
import HexButton from "./components/HexButton";
import GameBoard from "./components/GameBoard";
import OpponentBoardsFooter from "./components/OpponentBoardsFooter";
import Market from "./components/Market";
import PlayersDisplay from "./components/PlayersDisplay";
import PrivateGoalSelection from "./components/PrivateGoalSelection";
import GoalsDisplay from "./components/GoalsDisplay";
import GoalTooltip from "./components/GoalTooltip";
import GameSummaryPage from "./components/GameSummaryPage";
import PrivateGoal from "./components/PrivateGoal";
import BoardFrame from "./components/BoardFrame";
import PopulationTrack from "./components/PopulationTrack";
import StatBreakdown from "./components/StatBreakdown";
import GameLogModal from "./components/GameLogModal";
import TurnSkyWriter from "./components/TurnSkyWriter";
import ActionToast from "./components/ActionToast";
import { Fireworks } from "@fireworks-js/react";

import "./styles/App.css";

const App: React.FC = () => {
  // --- Setup & Network Hooks ---
  const { gameData, assetList, isAssetsLoaded, setIsAssetsLoaded } = useGameDataFetcher();
  const { errorMessage, setErrorMessage, actionError, setActionError } = useAutoClearErrors();
  const { gameState, setGameState, isSyncing, error, isActionPending, performAction } = useGameStateSync();

  // --- Core Game Session Hooks ---
  const {
    playerName, setPlayerName, selectedColor, setSelectedColor,
    lobbyPlayers, setLobbyPlayers, gameStarted, setGameStarted,
    joining, handleJoinGame, handleStartGame, handleResetGame,
    handleAddBot, handleRemoveBot
  } = useGameSession(gameState, setGameState, setErrorMessage);

  // --- User Interface Hooks ---
  const {
    viewingPlayerName, setViewingPlayerName,
    hoveredPlayerName, setHoveredPlayerName,
    isLogOpen, setIsLogOpen, handleOpenGameLog,
    breakdown, setBreakdown, handleStatClick,
    goalComparison, handleGoalHover,
    endGameLiveStats, setEndGameLiveStats, zoom, setZoom,
    centerCameraCounter, setCenterCameraCounter, highlightedStat, setHighlightedStat,
    bgIndex, handleBackgroundChange, showUndoRejected, setShowUndoRejected
  } = useGameUI(playerName, gameState, setActionError);

  // Reset carries stale end-game population data forward otherwise, since
  // GameSummaryPage only ever pushes new values via onLiveStatsUpdate — it
  // never clears them itself when a new game starts.
  const handleResetGameAndClearLiveStats = useCallback(() => {
    setEndGameLiveStats(null);
    return handleResetGame();
  }, [handleResetGame, setEndGameLiveStats]);

  // --- Derived Rule Logic ---
  const {
    isMyTurn, isMyTurnToDiscard, myPlayer, myBoard, validPlacements,
    showGoalSelection, showWaitingForPlayers, canUndo
  } = useDerivedGameState(gameState, playerName);

  const activeViewPlayerName = hoveredPlayerName || viewingPlayerName;

  const showTurnBanner = useTurnBanner(isMyTurn);

  // True whenever any of the undo-flow overlays below is being shown, so we
  // can render a single invisible backdrop that blocks clicks to the board
  // underneath (no dimming/blur — just prevents interacting with the game
  // while an undo prompt is up).
  const isUndoModalActive = Boolean(
    gameState?.activeUndoRequest || showUndoRejected
  );

  // --- Game Action Dispatcher ---
  const {
    selectedTile, setSelectedTile, actionMode, setActionMode,
    createLakeMode, setCreateLakeMode, selectedMarketForLake, setSelectedMarketForLake,
    recentlyPlaced, handleHexClick
  } = useGameActions({
    playerName, viewingPlayerName: activeViewPlayerName, isMyTurn, myBoard, validPlacements,
    currentTurnPlayerId: gameState?.currentTurnPlayerId || null,
    performAction, setErrorMessage, setActionError, isActionPending
  });

  // --- WebSocket Orchestrator ---
  const handleWebSocketMessage = useCallback((data: any) => {
    try {
      switch (data.type) {
        case "connection_established":
          console.log("[WS] Connection confirmed."); break;
        case "lobby_update":
          setGameStarted(false); setGameState(null);
          setLobbyPlayers(data.players || []); break;
        case "game_started":
          setLobbyPlayers([]); setGameStarted(true);
          setGameState(data.game_state || data.gameState); break;
        case "game_update":
          setGameState(data.game_state || data.gameState); break;
        case "undo_rejected":
          if (playerName === data.requester) setShowUndoRejected(true); break;
        case "game_reset":
          sessionStorage.clear();
          setPlayerName(""); setSelectedColor("");
          setGameStarted(false); setGameState(null); setLobbyPlayers([]); break;
      }
    } catch (err) {
      console.error("WebSocket error:", err);
    }
  }, [setGameState, playerName, setGameStarted, setLobbyPlayers, setPlayerName, setSelectedColor, setShowUndoRejected]);

  useWebSocketWithReconnect({ url: WS_URL, onMessage: handleWebSocketMessage });

  // ----------------------------------------------------------------------
  // Render Output
  // ----------------------------------------------------------------------
  if (!gameData || !isAssetsLoaded) {
    return (
      <>
        {gameData && assetList.length > 0 && (
          <ImagePreloader imageUrls={assetList} onComplete={() => setIsAssetsLoaded(true)} />
        )}
        <LoadingScreen />
      </>
    );
  }

  if (!gameStarted || !gameState) {
    return (
      <GameDataProvider data={gameData}>
        <div className="app-container" style={{ backgroundImage: "url('/assets/gameback/gameback1.webp')" }}>
          <Fireworks
            options={{ opacity: 0.5, intensity: 15, friction: 0.97, acceleration: 1.05, hue: { min: 100, max: 240 }, delay: { min: 30, max: 60 } }}
            style={{ top: 0, left: 0, width: "100%", height: "100%", position: "fixed", zIndex: 1, pointerEvents: "none" }}
          />
          <UnifiedIntro
            playerName={playerName} setPlayerName={setPlayerName}
            selectedColor={selectedColor} setSelectedColor={setSelectedColor}
            lobbyPlayers={lobbyPlayers} onJoinGame={handleJoinGame}
            isHost={lobbyPlayers.length > 0 && lobbyPlayers[0]?.name === playerName}
            handleStartGame={handleStartGame} joining={joining} errorMessage={errorMessage}
            onAddBot={handleAddBot} onRemoveBot={handleRemoveBot}
          />
        </div>
      </GameDataProvider>
    );
  }

  return (
    <GameDataProvider data={gameData}>
      <div className={`app-container-game game-bg-${bgIndex}`}>
        <TurnSkyWriter isMyTurn={isMyTurn} />
        {isSyncing && <div className="sync-indicator">🔄 Syncing...</div>}
        {error && <div className="error-banner">{error}</div>}
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {actionError && <div className="error-message action-error">{actionError}</div>}
        {showTurnBanner && (
          <div className="turn-banner-overlay">
            <img src="/assets/yourturn/yourturn.webp" alt="Your Turn!" className="turn-banner-gif" />
          </div>
        )}

        {/* FIX: Removed dead players/turnOrder props from BoardFrame — it accepts only children */}
        <BoardFrame>
          <main className="game-layout" style={{ width: "100%" }}>
            <div className="col col-2">
              <Market
                basicTiles={gameState.basicTiles}
                selectedTile={selectedTile}
                onTileSelect={(id, from, index) => {
                  if (createLakeMode) return;
                  setSelectedTile({ id, from, marketIndex: index });
                  setActionMode("place");
                }}
                currentPlayer={gameState.gameOver ? "" : (gameState.currentTurnPlayerId || "")}
                myPlayerName={playerName}
                myCash={gameState.players[playerName]?.money ?? 0}
                showOnlyBasics
                createLakeMode={createLakeMode}
                basicTileQuantities={gameState.basicTileQuantities}
                isActionPending={isActionPending}
                isGameOver={gameState.gameOver}
              />
              <GoalsDisplay goalIds={gameState.publicGoals} onGoalHover={handleGoalHover} />
            </div>

            <div className={`col col-3 ${isMyTurnToDiscard ? 'awaiting-action-glow' : ''}`}>
              <Market
                marketTiles={gameState.realEstateMarket}
                selectedTile={selectedTile}
                onTileSelect={(id, from, index) => {
                  if (isActionPending) return;
                  if (createLakeMode && from === "market" && typeof index === "number") {
                    setSelectedMarketForLake(index);
                    setActionMode("lake");
                    return;
                  }
                  if (isMyTurnToDiscard) {
                    performAction(() => api.discardMarketTile(playerName, index!));
                    return;
                  }
                  if (!createLakeMode) {
                    setSelectedTile({ id, from, marketIndex: index });
                    setActionMode("place");
                  }
                }}
                currentPlayer={gameState.gameOver ? "" : (gameState.currentTurnPlayerId || "")}
                myPlayerName={playerName}
                myCash={gameState.players[playerName]?.money ?? 0}
                showOnlyMarket
                createLakeMode={createLakeMode}
                onMarketTileSelectForLake={(index) => {
                  setSelectedMarketForLake(index);
                  setActionMode("lake");
                }}
                isDiscardMode={isMyTurnToDiscard}
                isActionPending={isActionPending}
                isGameOver={gameState.gameOver}
              />
            </div>

            <div className="col-board">
              <div className="game-board-header">
                <div className="header-left">
                  {(isMyTurn || canUndo) && activeViewPlayerName === playerName && (
                    <div className="header-left-actions-wrapper">
                      <div className="header-action-buttons">
                        {isMyTurn ? (
                          <>
                            <HexButton
                              onClick={() => {
                                setActionMode("place"); setCreateLakeMode(false); setSelectedMarketForLake(null);
                              }}
                              disabled={!isMyTurn}
                              className={actionMode === "place" && !createLakeMode ? "active" : ""}
                            >
                              Place Tile
                            </HexButton>

                            <HexButton
                              disabled={!isMyTurn}
                              onClick={() => {
                                const isEnteringLakeMode = !createLakeMode;
                                setCreateLakeMode(isEnteringLakeMode);
                                if (isEnteringLakeMode) {
                                  setActionMode('place'); setSelectedTile(null);
                                }
                                setSelectedMarketForLake(null);
                              }}
                              className={`create-lake-btn ${createLakeMode ? 'active' : ''}`}
                            >
                              Create Lake
                            </HexButton>

                            <HexButton
                              onClick={() => {
                                setActionMode("invest"); setCreateLakeMode(false); setSelectedMarketForLake(null);
                              }}
                              disabled={!isMyTurn}
                              className={actionMode === "invest" ? "active" : ""}
                            >
                              2X
                            </HexButton>
                          </>
                        ) : (
                          <HexButton
                            onClick={() => performAction(() => api.requestUndo(playerName))}
                            disabled={isActionPending}
                            className="active"
                          >
                            Undo Turn
                          </HexButton>
                        )}
                      </div>
                      {isMyTurn && (
                        <div className={`action-mode-indicator action-mode-${actionMode} hex-panel`}>
                          Mode: {actionMode.charAt(0).toUpperCase() + actionMode.slice(1)}
                        </div>
                      )}
                    </div>
                  )}
                  {activeViewPlayerName !== playerName && (
                    <div className="viewing-player-display hex-panel">
                      <span>Viewing: {activeViewPlayerName}</span>
                      <button onClick={() => setViewingPlayerName(playerName)}>Return</button>
                    </div>
                  )}
                </div>

                <div className="header-center">
                  {(gameState.currentTurnPlayerId || gameState.gameOver) && !createLakeMode && (
                    <div className={`turn-indicator hex-panel ${isMyTurn ? "your-turn" : ""}`}>
                      {(() => {
                        if (gameState.gameOver) {
                          return <span>GAME OVER</span>;
                        }
                        const currentPlayer = gameState.players[gameState.currentTurnPlayerId!];
                        if (!currentPlayer) return null;
                        const gemSrc = `/assets/colors/${currentPlayer.color}.webp`;
                        const isLastTurn = isMyTurn && gameState.finalTurnCountdown === 1;
                        const turnText = isLastTurn ? "LAST TURN" : (isMyTurn ? "YOUR TURN" : currentPlayer.name);
                        return (
                          <>
                            <img src={gemSrc} alt={currentPlayer.color} className="turn-indicator-gem" />
                            <span>{turnText}</span>
                            <img src={gemSrc} alt={currentPlayer.color} className="turn-indicator-gem" />
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div className="header-right">
                  <div className="zoom-controls hex-panel">
                    <button onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))} title="Zoom Out">-</button>
                    <span>{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom((z) => Math.min(z + 0.1, 2))} title="Zoom In">+</button>
                    <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.3)', margin: '0 2px' }} />
                    <button onClick={() => setCenterCameraCounter(c => c + 1)} title="Recenter Camera">⌖</button>
                  </div>
                </div>
              </div>

              <GameBoard
                placedTiles={gameState.playerBoards[activeViewPlayerName] || []}
                oneMoreRoundDrawn={gameState.oneMoreRoundDrawn}
                recentlyPlaced={recentlyPlaced}
                validPlacements={activeViewPlayerName === playerName && ((actionMode === "place" && selectedTile) || actionMode === "lake") ? validPlacements : []}
                onHexClick={handleHexClick}
                zoom={zoom}
                highlightedStat={highlightedStat}
                viewingPlayerColor={gameState.players[activeViewPlayerName]?.color || ''}
                centerCameraCounter={centerCameraCounter}
              />

              <OpponentBoardsFooter
                players={gameState.players}
                playerBoards={gameState.playerBoards}
                turnOrder={gameState.turnOrder}
                myPlayerName={playerName}
                viewingPlayerName={activeViewPlayerName}
                onSelectPlayer={setViewingPlayerName}
                onHoverPlayer={setHoveredPlayerName}
              />
            </div>

            <div className="col-players">
              <PlayersDisplay
                players={endGameLiveStats || gameState.players} turnOrder={gameState.turnOrder}
                playerBoards={gameState.playerBoards} currentPlayerId={gameState.gameOver ? null : gameState.currentTurnPlayerId}
                onPlayerView={setViewingPlayerName} onStatClick={handleStatClick}
                highlightedStat={highlightedStat} onStatHighlight={setHighlightedStat} onStatMouseLeave={() => setBreakdown(null)}
              />
              <div className="bottom-panel-row">
                <PrivateGoal goalId={myPlayer?.privateGoal} onGoalHover={handleGoalHover} />
                <div className="log-rules-buttons">
                  <HexButton onClick={handleOpenGameLog} size="small">Game Log</HexButton>
                  <HexButton onClick={() => window.open('/assets/tiles/rules/rules.html', '_blank')}>Rules</HexButton>
                  <HexButton onClick={handleBackgroundChange}>Background</HexButton>
                </div>
              </div>
            </div>

            <div className="col col-1">
              <PopulationTrack players={endGameLiveStats || gameState.players} />
            </div>
          </main>
        </BoardFrame>

        {breakdown && <StatBreakdown breakdown={breakdown} onClose={() => setBreakdown(null)} />}
        {goalComparison && <GoalTooltip data={goalComparison} />}

        {showGoalSelection && myPlayer && (
          <div className="goal-selection-wrapper">
            <PrivateGoalSelection
              goalOptions={myPlayer.privateGoalOptions!}
              onConfirm={async (goalId) => {
                try { await performAction(() => api.selectPrivateGoal(playerName, goalId)); }
                // FIX: getErrorMessage is now properly imported above
                catch (err) { setActionError(getErrorMessage(err)); }
              }}
              isSubmitting={false}
            />
          </div>
        )}

        {showWaitingForPlayers && (
          <div className="overlay-prompt waiting-players-overlay">
            <h2>Goal Selection In Progress</h2>
            <p>Waiting for other players to choose their private goal...</p>
          </div>
        )}

        {isMyTurnToDiscard && (
          <div className="overlay-prompt discard-prompt-overlay">
            <h2>Action Required</h2>
            <p>Please select a tile from the Real Estate Market to discard.</p>
          </div>
        )}

        {isMyTurn && createLakeMode && (
          <div className="overlay-prompt lake-prompt-overlay">
            <h2>Create a Lake</h2>
            {selectedMarketForLake === null ? (
              <><p>Select a tile from the Real Estate Market to convert into a lake.</p><p><small>You will pay the market fee for that tile.</small></p></>
            ) : (
              <><p style={{ color: '#39FF14', fontWeight: 'bold' }}>Tile Selected!</p><p>Now click an empty hex on your board to place the lake.</p></>
            )}
          </div>
        )}

        {gameState.gameOver && (
          <GameSummaryPage gameState={gameState} onReset={handleResetGameAndClearLiveStats} onLiveStatsUpdate={setEndGameLiveStats} />
        )}

        {isUndoModalActive && <div className="undo-modal-backdrop" />}

        {gameState?.activeUndoRequest?.requester === playerName && (
          <div className="overlay-prompt undo-prompt-overlay">
            <h2>Undo Requested</h2>
            <p>Waiting for other players to approve your undo request...</p>
          </div>
        )}

        {gameState?.activeUndoRequest && gameState.activeUndoRequest.requester !== playerName && !gameState.activeUndoRequest.votes[playerName] && (
          <div className="overlay-prompt undo-prompt-overlay">
            <h2>Undo Request</h2>
            <p>{gameState.activeUndoRequest.requester} is requesting to undo their turn.</p>
            <div className="undo-prompt-buttons">
              <HexButton onClick={() => performAction(() => api.voteUndo(playerName, 'approve'))} disabled={isActionPending} variant="highlight">Approve</HexButton>
              <HexButton onClick={() => performAction(() => api.voteUndo(playerName, 'reject'))} disabled={isActionPending} variant="active">Reject</HexButton>
            </div>
          </div>
        )}

        {gameState?.activeUndoRequest && gameState.activeUndoRequest.requester !== playerName && gameState.activeUndoRequest.votes[playerName] === 'approve' && (
          <div className="overlay-prompt undo-prompt-overlay">
            <h2>Approved</h2>
            <p>Waiting for other players to approve {gameState.activeUndoRequest.requester}'s undo...</p>
          </div>
        )}

        {showUndoRejected && (
          <div className="overlay-prompt undo-prompt-overlay">
            <h2>Request Rejected</h2>
            <p>Your undo request was denied by another player.</p>
            <div className="undo-prompt-buttons">
              <HexButton onClick={() => setShowUndoRejected(false)}>Close</HexButton>
            </div>
          </div>
        )}

        <GameLogModal isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} summaries={gameState?.turnHistory || []} gameState={gameState} />
        <ActionToast summary={gameState?.lastTurnSummary} />
      </div>
    </GameDataProvider>
  );
};

export default App;
