#!/bin/bash
# Load local config
[ -f .env.local ] && source .env.local
REMOTE_HOST="${JARVIS_SERVER_IP:-your-server-ip}"
REMOTE_PATH="${JARVIS_DEPLOY_PATH:-/path/to/jarvis}"

echo "🚀 Deploying to $REMOTE_HOST..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.next' \
  . ${JARVIS_SSH_HOST:-user@$REMOTE_HOST}:$REMOTE_PATH/
echo "✅ Deployed!"
