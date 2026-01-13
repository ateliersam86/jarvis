#!/bin/bash

# Configuration
REMOTE_USER="root"
REMOTE_HOST="${JARVIS_SERVER_IP}"
REMOTE_PATH="/mnt/user/websites/jarvis-nexus"
LOCAL_PATH="$(pwd)"

echo "⬇️  Pulling JARVIS memory from Server ($REMOTE_HOST)..."

# Pull shared memory files
rsync -avz --progress \
  "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/PROJECT_MEMORY.md" \
  "$LOCAL_PATH/"

rsync -avz --progress \
  "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/.conductor/" \
  "$LOCAL_PATH/.conductor/"

rsync -avz --progress \
  "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/.codex/" \
  "$LOCAL_PATH/.codex/"

rsync -avz --progress \
  "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/.memory/" \
  "$LOCAL_PATH/.memory/"

# Optional: Pull brain/ (Antigravity conversations)
# Uncomment if you want to sync Antigravity history
# rsync -avz --progress \
#   "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/brain/" \
#   "$LOCAL_PATH/brain/"

echo "✅ Pull Complete! Shared memory synced from Server."
echo ""
echo "📋 Files updated:"
echo "  - PROJECT_MEMORY.md (Unified Project Memory)"
echo "  - .conductor/state.json (Orchestration State)"
echo "  - .codex/config.toml (Codex Config)"
echo "  - .memory/*.json (Worker Memory Files)"
echo ""
echo "🚀 You can now continue working with the same context!"
