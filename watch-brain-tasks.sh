#!/bin/bash
# watch-brain-tasks.sh
# Real-time watcher that auto-syncs task.md to dashboard when it changes

BRAIN_DIR="$HOME/.gemini/antigravity/brain"
TARGET_DIR=".memory/tasks"

mkdir -p "$TARGET_DIR"

echo "👁️ Watching for task.md changes in $BRAIN_DIR..."
echo "   Press Ctrl+C to stop"
echo ""

# Find current task.md
sync_task() {
    LATEST_TASK=$(find "$BRAIN_DIR" -name "task.md" -type f 2>/dev/null | xargs ls -t 2>/dev/null | head -1)
    
    if [ -n "$LATEST_TASK" ]; then
        cp "$LATEST_TASK" "$TARGET_DIR/current.md"
        echo "$(date '+%H:%M:%S') ✅ Synced: $(basename $(dirname $LATEST_TASK))/task.md"
        
        # Also sync plan if exists
        CONV_DIR=$(dirname "$LATEST_TASK")
        if [ -f "$CONV_DIR/implementation_plan.md" ]; then
            cp "$CONV_DIR/implementation_plan.md" "$TARGET_DIR/plan.md"
        fi
    fi
}

# Initial sync
sync_task

# Watch for changes using fswatch (macOS) or inotifywait (Linux)
if command -v fswatch &> /dev/null; then
    fswatch -o "$BRAIN_DIR" --include "task.md" | while read; do
        sync_task
    done
elif command -v inotifywait &> /dev/null; then
    while inotifywait -r -e modify,create "$BRAIN_DIR" 2>/dev/null; do
        sync_task
    done
else
    # Fallback: poll every 5 seconds
    echo "⚠️ fswatch/inotifywait not found, using 5s polling..."
    while true; do
        sleep 5
        sync_task
    done
fi
