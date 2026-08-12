# backend/app/websocket.py
import logging
import asyncio
from typing import List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        # FIX: Snapshot the connection list before iterating. Without this, a concurrent
        # disconnect() call (e.g. from a client dropping during a broadcast) mutates
        # active_connections while asyncio.gather is still iterating over it, which can
        # cause connections to be skipped or raise a RuntimeError. Taking a shallow copy
        # here means the gather always works on a stable snapshot; any connections that
        # were dropped mid-broadcast are still cleaned up via the results below.
        connections_snapshot = list(self.active_connections)

        async def send_to_client(connection: WebSocket):
            try:
                await connection.send_text(message)
                return None
            except Exception as e:
                logging.warning(f"Failed to send message to a client, flagging for removal: {e}")
                return connection

        # Execute all sends concurrently using asyncio.gather
        results = await asyncio.gather(*(send_to_client(c) for c in connections_snapshot))

        # Clean up any connections that threw errors during this broadcast
        dead_connections = filter(None, results)
        for dead in dead_connections:
            self.disconnect(dead)

manager = ConnectionManager()
