#!/bin/bash
echo "Starting Jarvis Web + PTY Server..."

# Install dependencies (Required for new packages)
npm install

# Start PTY Server in background
node pty-server.mjs &
PTY_PID=$!

# Start Next.js (Bind to all interfaces for Docker access)
npm run dev -- -H 0.0.0.0


# Cleanup
kill $PTY_PID
