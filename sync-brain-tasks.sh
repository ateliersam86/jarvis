#!/bin/bash
# sync-brain-tasks.sh
# Auto-syncs Antigravity brain task.md to .memory/tasks for Dashboard visibility

BRAIN_DIR="$HOME/.gemini/antigravity/brain"
TARGET_DIR=".memory/tasks"

# Create target directory if needed
mkdir -p "$TARGET_DIR"

# Find the most recently modified task.md in brain conversations
LATEST_TASK=$(find "$BRAIN_DIR" -name "task.md" -type f 2>/dev/null | xargs ls -t 2>/dev/null | head -1)

if [ -z "$LATEST_TASK" ]; then
    echo "⚠️ No task.md found in $BRAIN_DIR"
    exit 1
fi

echo "📄 Found: $LATEST_TASK"

# Copy to target
cp "$LATEST_TASK" "$TARGET_DIR/current.md"
echo "✅ Synced to $TARGET_DIR/current.md"

# Also sync the implementation_plan.md if it exists
CONV_DIR=$(dirname "$LATEST_TASK")
if [ -f "$CONV_DIR/implementation_plan.md" ]; then
    cp "$CONV_DIR/implementation_plan.md" "$TARGET_DIR/plan.md"
    echo "✅ Synced implementation_plan.md"
fi

# Show last modified time
echo "📅 Last modified: $(stat -f '%Sm' "$LATEST_TASK" 2>/dev/null || stat -c '%y' "$LATEST_TASK" 2>/dev/null)"
