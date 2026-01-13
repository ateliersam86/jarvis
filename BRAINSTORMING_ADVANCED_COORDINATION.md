# Brainstorming: Advanced AI Coordination Features

This document outlines the architectural plan for three advanced features: Agent Negotiation, Cross-Project Memory, and Autonomous Error Recovery.

## 1. Agent-to-Agent Negotiation for Task Prioritization

**Goal:** Move from a "push" model (Manager assigns task) to a "market" model (Workers bid on tasks based on suitability).

### Current State
- `masterscript.mjs` decomposes tasks and pushes them to Redis list `jarvis:tasks`.
- Any available worker picks up the next task (FCFS - First Come First Served).
- Issue: A "junior" model might pick up a complex architectural task, or a specialist might get a generic task.

### Proposed Architecture: "The Bidding Protocol"

1.  **Task Announcement**:
    - Instead of pushing to `jarvis:tasks`, the orchestrator publishes to a pub/sub channel `jarvis:market`.
    - Payload: `{ taskId, complexity, requiredSkills: ['react', 'database'], description }`

2.  **Worker Evaluation**:
    - Each idle worker listens to `jarvis:market`.
    - Worker calculates a `BidScore` (0.0 to 1.0) based on:
        - **Expertise Match**: Does `memory.expertise` match `requiredSkills`?
        - **Recent Context**: Has the worker recently touched related files?
        - **Model Capability**: Is the underlying model (Flash vs Pro) capable enough?
    - Worker publishes bid to `jarvis:bids:{taskId}`.

3.  **Assignment**:
    - Orchestrator waits for a short window (e.g., 500ms).
    - Selects the highest bidder.
    - Pushes the task directly to `jarvis:tasks:{workerId}`.

### Implementation Steps
- [ ] Modify `scripts/masterscript.mjs` to implement the "Auctioneer" logic.
- [ ] Update `swarm/worker.js` to implement `calculateBid()` and listen to the market channel.
- [ ] Add `expertise` weighting to the worker memory structure.

---

## 2. Cross-Project 'Long-Term' Memory Synthesis

**Goal:** Enable agents to learn from solutions implemented in other projects (e.g., "How did we set up Auth in `atelier-sam`?").

### Current State
- Memory is siloed in `.memory/projects/{projectId}/`.
- `active_project.json` determines the visibility scope.
- Agents have zero visibility into other projects' `context_map.json`.

### Proposed Architecture: "The Librarian"

1.  **The Global Index**:
    - Create a new artifact `.memory/global_index.json`.
    - Contains a high-level map of "Capabilities" to "Projects".
    - Example: `{"auth": ["atelier-sam", "jarvis"], "threejs": ["portfolio-v1"]}`.

2.  **The Librarian Agent (`scripts/librarian.mjs`)**:
    - A background process that runs on a schedule (or on demand).
    - **Crawl**: Reads `context_map.json` from all projects in `.memory/projects.json`.
    - **Synthesize**: Extracts "Patterns" (e.g., "Prisma Schema Pattern", "NextAuth Config").
    - **Store**: Updates `.memory/patterns.json`.

3.  **Query Interface**:
    - Add a `searchGlobalMemory` tool for agents.
    - When an agent fails to solve a problem, it can query: "Find solution for 'NextAuth callback error' in other projects".

### Implementation Steps
- [ ] Create `scripts/librarian.mjs` to aggregate context maps.
- [ ] Define a `Pattern` schema (Name, Description, FilePath, Project).
- [ ] Expose `search_patterns` in the `codebase_investigator` tool.

---

## 3. Autonomous Error Recovery (The Guardian)

**Goal:** Proactive, self-healing system that detects "stuck" states or recurring errors and intervenes without human input.

### Current State
- `auto-healer.mjs` runs *after* a task generation to fix lint/type errors.
- If a logic error occurs or a worker hangs, the user must manually restart or debug.

### Proposed Architecture: "The Guardian"

1.  **Event Stream Monitoring**:
    - Create a dedicated process `scripts/guardian.mjs`.
    - Subscribes to Redis stream `jarvis:events`.

2.  **Heuristics Engine**:
    - **Stall Detection**: If a task is `IN_PROGRESS` > 5 minutes, mark as STALLED.
    - **Error Spirals**: If 3 consecutive tasks fail with the same error key.
    - **Resource Exhaustion**: If `tokenUsage` spikes abnormally.

3.  **Intervention Protocols**:
    - **Level 1 (Soft)**: Send `SIGUSR1` to the worker (triggers a "dump state" log).
    - **Level 2 (Reset)**: Kill and restart the specific worker container.
    - **Level 3 (Escalate)**: Pause the swarm and trigger a "Root Cause Analysis" task for `gemini:pro`.

4.  **Self-Correction**:
    - If a file modification breaks the build (detected via file watcher + build check), the Guardian automatically reverts the file to the git `HEAD` state and logs the incident.

### Implementation Steps
- [ ] Create `scripts/guardian.mjs` with Redis stream monitoring.
- [ ] Implement `checkHealth()` loop.
- [ ] Integrate with `docker` CLI to manage worker containers.

