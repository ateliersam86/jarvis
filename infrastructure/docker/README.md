# Docker Workers (Optional)

> **⚠️ This is an ADVANCED feature for self-hosters who clone the project.**
> 
> The main Jarvis site uses visitors' local CLI installations (Gemini CLI, Claude CLI, Codex).

## When to Use Docker Workers

Docker workers are useful when you want to:
- Run AI agents on a central server instead of locally
- Share agent resources across multiple machines
- Have agents running 24/7 without your laptop being on

## Quick Start

1. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

2. Start the workers:
   ```bash
   docker-compose up -d
   ```

3. Check status:
   ```bash
   docker-compose ps
   ```

## Architecture

```
┌─────────────────────────────────────┐
│           Your Server               │
├─────────────────────────────────────┤
│  jarvis-worker-gemini (Gemini CLI)  │
│  jarvis-worker-claude (Claude CLI)  │
│  jarvis-worker-codex  (Codex CLI)   │
│  jarvis-redis         (Memory)      │
│  jarvis-web           (Dashboard)   │
└─────────────────────────────────────┘
```

## Not Required For

- Using jarvis.atelier-sam.fr (uses your local CLIs)
- Running `masterscript.mjs` locally
- The Jarvis SDK
