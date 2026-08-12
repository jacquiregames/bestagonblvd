#!/bin/bash
gnome-terminal -- bash -c "python3 -m backend.app.main; exec bash"
gnome-terminal -- bash -c "pnpm run dev; exec bash"
