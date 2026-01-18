# 🤖 Jarvis Orchestrator

> Multi-Agent AI CLI - Orchestrate Gemini, Claude & Codex

[![npm](https://img.shields.io/npm/v/jarvis-orchestrator)](https://www.npmjs.com/package/jarvis-orchestrator)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

## Installation

```bash
npm install -g jarvis-orchestrator
```

## Quick Start

```bash
# Simple task
jarvis "Refactor this module and add tests"

# Interactive mode
jarvis chat

# Check agent status
jarvis status
```

## Advanced Modes

```bash
# 🐝 Swarm - Parallel multi-agent execution
jarvis "Complete redesign" --swarm

# 🪞 Reflect - Multi-agent consensus
jarvis "Architecture review" --reflect --agents=3

# 📋 Plan-First - Validate before execution
jarvis "Refactor auth" --plan-first

# 📦 Context Injection - Include file context
jarvis "Add loading state" --include src/Stats.tsx
```

## Models

```bash
--model gemini:flash   # Fast (default)
--model gemini:pro     # Pro
--model claude:sonnet  # Balanced
--model claude:opus    # Max intelligence
--model openai:codex   # Tests/Debug
```

## Requirements

- Node.js 18+
- At least one AI CLI installed:
  - [Gemini CLI](https://github.com/google/gemini-cli)
  - [Claude CLI](https://github.com/anthropics/claude-cli)
  - [Codex CLI](https://github.com/openai/codex-cli)

## Dashboard

Track your projects at [jarvis.atelier-sam.fr](https://jarvis.atelier-sam.fr)

## License

MIT
