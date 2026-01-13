#!/bin/bash
echo "🔄 Restarting Swarm Workers on Server..."
ssh ${JARVIS_SSH_HOST} "docker restart jarvis-worker-gemini jarvis-worker-claude jarvis-worker-chatgpt"
echo "✅ Swarm Restarted. Heartbeats should start in ~10 seconds."
