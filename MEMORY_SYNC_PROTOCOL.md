# Jarvis Memory Synchronization Protocol (v1.0)

This document defines the protocol for synchronizing intelligence and state between local Jarvis CLI environments and the centralized Jarvis Dashboard (https://jarvis.atelier-sam.fr).

## 1. Architecture

The synchronization follows a **Client-Server Hybrid** model:
- **Client:** Jarvis CLI (running on macOS/Windows/Linux).
- **Server:** Next.js Dashboard API (`jarvis.atelier-sam.fr/api`).
- **Storage:** Local `.memory/` directory vs Server-side Database (Prisma/SQLite) + Cloud `.memory/` backup.

## 2. API Endpoints

### REST API (`/api/memory`)

| Method | Endpoint | Description | Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/memory/status` | Get sync status and last modified timestamps. | `None` |
| `POST` | `/api/memory/pull` | Pull specific memory files from server. | `{ "files": ["projects.json", "jarvis/gemini.json"] }` |
| `POST` | `/api/memory/push` | Push local memory files to server. | `{ "files": { "path/to/file": content } }` |
| `POST` | `/api/memory/sync-task` | Specialized endpoint for task completion sync. | `TaskResultSchema` |
| `GET` | `/api/projects/active` | Get the currently active project ID. | `None` |
| `POST` | `/api/projects/active` | Switch the active project across all clients. | `{ "projectId": "string" }` |

### WebSocket (`/ws/memory`)

Used for real-time broadcasts of state changes.

- **Event: `STATE_CHANGED`**: Broadcasted when a project is switched or a swarm task finishes.
- **Event: `MEM_UPDATE`**: Broadcasted when a worker memory is updated.

## 3. Conflict Resolution Strategy

We employ a **"Timestamped Merge"** strategy to ensure no data loss while maintaining consistency.

### A. Last-Write-Wins (LWW)
For single-value fields (e.g., `status`, `modelId`, `activeProjectId`), the version with the most recent `updatedAt` or `lastActive` timestamp wins.

### B. List Merging (Recent Tasks)
For `recentTasks` arrays:
1. Combine local and remote arrays.
2. De-duplicate by `taskId`.
3. Sort by `timestamp` descending.
4. Truncate to the most recent 50 entries.

### C. Markdown Convergence (PROJECT_MEMORY.md)
For `.md` files, if both sides have changed:
1. Attempt a line-based merge (if possible).
2. If conflict is detected, the Dashboard version takes precedence, and the CLI version is backed up as `PROJECT_MEMORY.local.bak`.

## 4. JSON Schemas

### Worker Memory (`{agentId}.json`)
```json
{
  "workerId": "string",
  "modelId": "string",
  "status": "online" | "offline" | "busy",
  "lastActive": "string",
  "totalTasks": "number",
  "successRate": "number",
  "recentTasks": [
    {
      "taskId": "string",
      "timestamp": "string",
      "type": "string",
      "input": "string",
      "output": "string",
      "success": "boolean",
      "responseTime": "number",
      "model": "string",
      "filesModified": ["string"]
    }
  ],
  "expertise": "Record<string, number>",
  "context": {
    "lastFiles": ["string"],
    "lastTopics": ["string"],
    "knownIssues": ["string"]
  },
  "performance": {
    "averageResponseTime": "number",
    "totalTokensUsed": "number",
    "errorRate": "number"
  }
}
```

### Active Project (`active_project.json`)
```json
{
  "projectId": "string",
  "switchedAt": "string",
  "switchedBy": "system" | "user-cli" | "user-web"
}
```

### Context Map (`context_map.json`)
```json
{
  "timestamp": "string",
  "structure": {
    "pages": ["string"],
    "components": ["string"],
    "api": ["string"],
    "lib": ["string"],
    "styles": ["string"],
    "scripts": ["string"]
  },
  "database": {
    "models": ["string"],
    "enums": ["string"]
  },
  "config": "Record<string, unknown>"
}
```

## 5. Synchronization Flow

### CLI Initialization (The "Handshake")
1. CLI runs `jarvis sync`.
2. CLI sends local timestamps of all files in `.memory/`.
3. Server compares with its records and returns a list of files that need to be `pushed` (local is newer) or `pulled` (server is newer).
4. CLI performs the batch operations.

### Task Completion (Automatic Sync)
1. Task finishes in CLI.
2. CLI calls `POST /api/memory/sync-task`.
3. Server updates DB and files, then broadcasts `MEM_UPDATE` to all connected Dashboards.
