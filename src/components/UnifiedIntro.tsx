import React, { useEffect, useState } from "react";
import "../styles/UnifiedIntro.css";
import type { LobbyPlayer } from "../types"; 
import HexButton from './HexButton'; 
 
const colorOptions = [
  { name: "blue", src: "/assets/colors/blue.webp" },
  { name: "cyan", src: "/assets/colors/cyan.webp" },
  { name: "green", src: "/assets/colors/green.webp" },
  { name: "grey", src: "/assets/colors/grey.webp" },
  { name: "orange", src: "/assets/colors/orange.webp" },
  { name: "black", src: "/assets/colors/black.webp" },
  { name: "purple", src: "/assets/colors/purple.webp" },
  { name: "red", src: "/assets/colors/red.webp" },
  { name: "white", src: "/assets/colors/white.webp" }, 
  { name: "yellow", src: "/assets/colors/yellow.webp" },
];

const BG_IMAGES = [
  '/assets/gameback/gameback4.webp',
  '/assets/gameback/gameback5.webp',
  '/assets/gameback/gameback6.webp',
  '/assets/gameback/gameback7.webp',
  '/assets/gameback/gameback8.webp',
];

interface Props {
  playerName: string;
  setPlayerName: (name: string) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  lobbyPlayers: LobbyPlayer[];  
  onJoinGame: () => void;
  isHost: boolean;
  handleStartGame: () => void;
  joining: boolean;
  errorMessage: string;
  onAddBot: () => void;
  onRemoveBot: (name: string) => void;
}

const MAX_LOBBY_PLAYERS = 4; // matches the backend's MAX_LOBBY_PLAYERS

const UnifiedIntro: React.FC<Props> = ({
  playerName,
  setPlayerName,
  selectedColor,
  setSelectedColor,
  lobbyPlayers,
  onJoinGame,
  isHost,
  handleStartGame,
  joining,
  errorMessage,
  onAddBot,
  onRemoveBot,
}) => {
  const [showPanel, setShowPanel] = useState(false);
  const [logoDone, setLogoDone] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const panelTimer = setTimeout(() => setShowPanel(true), 2500);
    
    // Cycle the background image every 8 seconds
    const bgInterval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BG_IMAGES.length);
    }, 8000);
 
    return () => {
      clearTimeout(panelTimer); 
      clearInterval(bgInterval);
    };
  }, []);

  const hasJoined = lobbyPlayers.some((p) => p.name === playerName);

  const colorRows = [ colorOptions.slice(0, 4), colorOptions.slice(4, 7), colorOptions.slice(7, 9), colorOptions.slice(9, 10) ];

  return (
    <div className="intro-screen-root">
      {/* 1. KEN BURNS BACKGROUND */}
      <div className="intro-ken-burns-bg">
        {BG_IMAGES.map((src, index) => (
          <div
            key={src}
            className={`intro-bg-layer ${index === bgIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
      </div>

      <div className="intro-container-outer">  
        
        {/* === NEW: INDEPENDENT LOGO CONTAINER === */}
        <div className="logo-container">
          <img
            src="/assets/bestagon.webp"
            alt="Bestagon Blvd"
            className={`main-logo-top ${logoDone ? "done" : ""}`}
            onAnimationEnd={() => setLogoDone(true)}
          />    
        </div>
        
        {/* === NEW: INDEPENDENT PANEL CONTAINER === */}
        <div className="panel-container"> 
          
          {/* COMBINED WRAPPER: Fade in the entire panel background along with the inputs */}
          <div className={`intro-panel fade-in-panel ${showPanel || hasJoined ? 'visible' : ''}`}>
            {!hasJoined ? (
              <>
                {/* ... (Join game inputs remain the same) ... */}
                {showPanel && (
                  <>
                    <input
                      type="text"
                      className="intro-input"
                      placeholder="Enter your name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                    />
                    <div className="color-options-pyramid">
                      {colorRows.map((row, rowIndex) => (
                        <div key={rowIndex} className="color-row">
                          {row.map((color) => {
                            const isTaken = lobbyPlayers.some(p => p.color === color.name);
                            const isSelected = selectedColor === color.name;
                            return (
                              <img
                                key={color.name}
                                src={color.src}
                                alt={color.name}
                                className={`color-gem ${isSelected ? "selected" : ""} ${isTaken ? "taken" : ""}`}
                                onClick={() => !isTaken && setSelectedColor(color.name)}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    <HexButton variant="primary" onClick={onJoinGame} disabled={joining || !playerName.trim() || !selectedColor}>
                      {joining ? "Joining..." : "Join Game"}
                    </HexButton>
                    {errorMessage && <div className="intro-error">{errorMessage}</div>}
                  </>
                )}
              </>
            ) : (
              <> 
                {/* ... (Lobby logic remains exactly the same) ... */}
                <h1 className="intro-title typewriter">lobby</h1>
                <p className="lobby-subtitle">Waiting for players to join...</p> 
                <ul className="lobby-list">
                  {lobbyPlayers.map((player) => { 
                    const colorInfo = colorOptions.find(c => c.name === player.color);
                    return (
                      <li key={player.name} className="lobby-player-item" style={{ '--player-color': player.color } as React.CSSProperties}>
                        {colorInfo && <img src={colorInfo.src} className="lobby-player-color-icon player-glow-icon" />}
                        <span className="lobby-player-name player-glow-text">
                          {player.name}{player.name === lobbyPlayers[0]?.name ? ' (Host)' : ''}
                        </span>
                        {isHost && player.isBot && (
                          <button
                            type="button"
                            className="lobby-remove-bot-btn"
                            aria-label={`Remove ${player.name}`}
                            onClick={() => onRemoveBot(player.name)}
                          >
                            ✕
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul> 
                {isHost && (
                  <HexButton
                    variant="active"
                    onClick={onAddBot}
                    disabled={lobbyPlayers.length >= MAX_LOBBY_PLAYERS}
                  >
                    + Add Bot
                  </HexButton>
                )}
                {isHost && <HexButton variant="primary" onClick={handleStartGame}>Start Game</HexButton>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedIntro;