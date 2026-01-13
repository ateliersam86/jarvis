# Jarvis CLI Reference

The Jarvis CLI is the primary tool for delegating tasks, managing memory, and coordinating agents.

## Masterscript (`masterscript.mjs`)

The entry point for most CLI operations.

### Usage
```bash
node scripts/masterscript.mjs [command] [options]
```

### Common Commands

| Command | Description |
| :--- | :--- |
| `delegate "task description"` | Delegates a natural language task to the appropriate agent. |
| `--swarm` | Activates swarm mode to decompose tasks into parallel sub-tasks. |
| `status` | Checks the health of connected agents and services. |

### Examples

**Delegate a refactoring task:**
```bash
node scripts/masterscript.mjs delegate "Refactor the ProjectGrid component to use the new API"
```

**Run a swarm task:**
```bash
node scripts/masterscript.mjs delegate "Analyze the entire src folder and generate a report" --swarm
```

## Utility Scripts

### `sync-to-unraid.sh`
Synchronizes your local workspace state and `GEMINI.md` memory to the remote Unraid server (if configured).

### `pull-from-unraid.sh`
Retrieves the latest state from the remote server, ensuring you are working with the most up-to-date context.

### `auto-healer.mjs`
Runs in the background to automatically fix linting errors, type mismatches, and syntax issues.

## Environment Variables

Ensure these are set in your `.env` or system environment:
- `GEMINI_API_KEY`: For Google Gemini models.
- `OPENAI_API_KEY`: For GPT-4 and Codex.
- `ANTHROPIC_API_KEY`: For Claude models.
- `REDIS_URL`: Connection string for the Redis instance.
