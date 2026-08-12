# 🏙️ Bestagon Blvd.

**Bestagon Blvd.** is a real-time, multiplayer digital adaptation of the acclaimed city-building board game *Suburbia*, specifically designed for LAN parties.

Players compete to build the most successful borough by purchasing hexagonal tiles from a shifting real-estate market, managing their city's Income and Reputation, and racing to hit Population milestones while competing for Public and Private Goals.

---

## ✨ Key Features

* **Real-Time Multiplayer:** Built on a hybrid REST/WebSocket architecture. Player actions are validated via REST, and the resulting state is instantly broadcasted to all clients via WebSockets.
* **LAN-Party Ready:** No configuration required for players. The backend dynamically binds to the host's local IP, allowing players on the same network to join effortlessly.
* **Democratic Undo System:** Made a mistake? Request a "take-backsie". The game pauses and prompts all other players to vote. If approved unanimously, the game state restores a previous turn snapshot.
* **Smart Board Engine:** The interactive hex grid automatically recalculates its bounding box, keeping the city perfectly centered and allowing fluid zooming and panning.
* **Cascading Event Engine:** Complex tile interactions (adjacencies, global triggers, red-line crossings, and investments) are fully automated and logged in a detailed game archive.

---

## 🛠️ Tech Stack

### Frontend
* **React 19** & **TypeScript**
* **Vite** for lightning-fast HMR and bundling.
* **CSS Modules/Styles** for layout resilience and animations.
* **@fireworks-js/react** for victory celebrations.

### Backend
* **Python 3** & **FastAPI**
* **Uvicorn** as the ASGI server.
* **Pydantic V2** for strict data validation, serialization, and snapshot restoration.
* **WebSockets** for real-time game state synchronization.

---

## 🚀 Installation & Setup

### Prerequisites
* **Node.js** (v18+ recommended)
* **pnpm** (Package manager, `npm install -g pnpm`)
* **Python 3.9+** 

### 1. Install Frontend Dependencies
From the root of the project:
```bash
pnpm install

2. Install Backend Dependencies

It is recommended to set up a Python virtual environment:
code Bash

cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install fastapi uvicorn pydantic
cd ..

3. Run the Game

If you are on a Linux/Unix system with GNOME, you can use the provided startup script which launches both the frontend and backend in separate terminal windows:
code Bash

chmod +x bestagonblvd.sh
./bestagonblvd.sh

Manual Startup:
Terminal 1 (Backend):
code Bash

python -m backend.app.main

Terminal 2 (Frontend):
code Bash

pnpm run dev

🎮 How to Play (LAN)

    Host the Game: Run the servers on a single machine. The backend will output the local network IP (e.g., 192.168.1.50:3000) it bound to.

    Join the Lobby: Other players on the same Wi-Fi/LAN can open their browser and navigate to the host's Vite development server IP (e.g., http://192.168.1.50:5173).

    Start: Enter your name, pick a color gem, and once everyone is in, the host clicks Start Game.

📂 Project Structure
code Text

├── backend/
│   └── app/
│       ├── data/            # Hardcoded tile definitions and goals (A, B, C, Basic)
│       ├── main.py          # FastAPI application, REST endpoints, and WS routing
│       ├── game_rules.py    # Game logic, state mutations, and effect calculations
│       ├── goal_evaluator.py# Logic for checking public and private goal conditions
│       ├── models.py        # Pydantic schemas for the internal Game State
│       ├── schemas.py       # Pydantic schemas for incoming API requests
│       └── websocket.py     # WebSocket connection manager
├── src/
│   ├── components/          # React components (Board, Market, PlayersDisplay, etc.)
│   ├── context/             # React Context for static game data
│   ├── hooks/               # Custom hooks for WS syncing, UI state, and actions
│   ├── styles/              # Global and component-specific CSS
│   ├── utils/               # Hex math and asset management
│   ├── App.tsx              # Main application layout and routing logic
│   └── types.ts             # TypeScript interfaces mirroring the backend models
├── bestagonblvd.sh          # Linux startup script
└── package.json             # Frontend dependencies

⚖️ Acknowledgments

    Bestagon Blvd. is a digital adaptation inspired by the board game Suburbia, designed by Ted Alspach and published by Bezier Games. This project is a non-commercial, fan-made creation intended for private LAN play.