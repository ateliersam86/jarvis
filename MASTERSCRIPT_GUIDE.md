# 🚀 Masterscript Delegation System - Usage Guide

## Overview

The Masterscript system intelligently routes tasks to the optimal AI CLI based on task type, optimizing quota usage by delegating low-level tasks to infinite-quota CLIs.

## Architecture

```
Antigravity + Opus 4.5 (Orchestrator)
         │
         ├─→ Gemini CLI (∞ Quota) → Lint, Type Errors, Docs
         ├─→ Codex CLI (∞ Quota) → Tests, Commits, Prototypes
         └─→ Opus 4.5 (Premium) → Architecture, Complex Refactoring
```

## Task Routing Rules

| Agent | Triggers | Use Cases |
|-------|----------|-----------|
| **Gemini** | `lint`, `type error`, `docs`, `readme`, `jsdoc` | Fix ESLint errors, TypeScript issues, generate documentation |
| **Codex** | `test`, `commit`, `prototype`, `ci/cd` | Write unit tests, generate commit messages, scaffold code |
| **Opus** | `architecture`, `refactor`, `design`, `security` | System design, complex refactoring, API design |

## Installation

### 1. CLIs Already Installed ✅
```bash
which gemini  # /Users/samuelmuselet/.nvm/versions/node/v20.19.5/bin/gemini
which codex   # /Users/samuelmuselet/.nvm/versions/node/v20.19.5/bin/codex
```

### 2. Configuration Files Created ✅
- `GEMINI.md` - Shared memory for Gemini CLI
- `.codex/config.toml` - Codex project settings
- `scripts/masterscript.mjs` - Delegation logic

## Usage

### Via NPM Scripts (Recommended)

```bash
# Dry run (see which agent would be used)
npm run delegate:dry "fix all lint errors"

# Execute delegation
npm run delegate "write unit tests for worker.js"
```

### Direct Execution

```bash
# Dry run
node scripts/masterscript.mjs "fix type errors" --dry-run

# Execute with auto-approval
node scripts/masterscript.mjs "generate commit message" --yolo

# Interactive mode
node scripts/masterscript.mjs "explain authentication" --interactive
```

## Examples

### 1. Fix Lint Errors → Gemini
```bash
npm run delegate "fix all ESLint errors in the project"
```
**Output:**
```
🎯 Task Classification: GEMINI
📋 Reason: Matched keyword: "lint"
🔷 Delegating to Gemini CLI...
✅ Loaded GEMINI.md as system context
```

### 2. Generate Tests → Codex
```bash
npm run delegate "write unit tests for swarm/worker.js" --yolo
```
**Output:**
```
🎯 Task Classification: CODEX
📋 Reason: Matched keyword: "test"
🔶 Delegating to Codex CLI...
```

### 3. Architecture Work → Opus
```bash
npm run delegate:dry "refactor the entire authentication system"
```
**Output:**
```
🎯 Task Classification: OPUS
📋 Reason: Matched keyword: "refactor"
🔴 Task requires Opus 4.5 - Please handle manually or via Antigravity
```

## Integration with Jarvis Workers

The Masterscript can also delegate to Jarvis workers via Redis:

```javascript
import { delegate } from './scripts/masterscript.mjs';

// Programmatic usage
const result = await delegate("fix lint errors", { yolo: true });
if (result.success) {
  console.log(result.output);
}
```

## Shared Memory (GEMINI.md)

The `GEMINI.md` file is automatically loaded by Gemini CLI as system context:

```markdown
# Gemini CLI - System Prompt for Atelier-Sam Project

## Context
This is a Next.js 15 project for a professional web designer...

## Your Role
You are a code healer - fix lint errors, type errors...
```

**Location:** `/Users/samuelmuselet/Jarvis/GEMINI.md`

## Codex Configuration

The `.codex/config.toml` defines project-specific settings:

```toml
model = "o3-mini"
ask_for_approval = "on-request"
sandbox = "workspace-write"

[project]
name = "Jarvis AI Nexus"
```

**Location:** `/Users/samuelmuselet/Jarvis/.codex/config.toml`

## Quota Savings

By delegating low-level tasks to Gemini/Codex CLIs:
- **Expected Savings:** 60-80% reduction in Opus quota usage
- **Gemini/Codex:** Unlimited quota (Google subscription)
- **Opus 4.5:** Reserved for complex architectural work

## Troubleshooting

### Gemini CLI not found
```bash
npm install -g @google/gemini-cli
```

### Codex CLI not found
```bash
npm install -g @openai/codex
```

### GEMINI.md not loading
Ensure the file exists in the project root:
```bash
ls -la GEMINI.md
```

## Next Steps

1. **Test delegation:** Run `npm run delegate:dry "fix lint errors"`
2. **Integrate with IDE:** Add VS Code tasks for common delegations
3. **Monitor quota:** Track Opus usage reduction over time
4. **Expand rules:** Add more keywords to `TASK_ROUTES` in `masterscript.mjs`

## Files Created

- ✅ `scripts/masterscript.mjs` - Main delegation script
- ✅ `GEMINI.md` - Shared memory for Gemini
- ✅ `.codex/config.toml` - Codex configuration
- ✅ `package.json` - Added `delegate` and `delegate:dry` scripts
- ✅ `masterscript_plan.md` - Implementation plan (artifact)
