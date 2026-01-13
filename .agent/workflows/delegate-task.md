---
description: How to properly delegate tasks to AI agents in Jarvis
---

# Agent Delegation Workflow

Before delegating ANY task:

1. **Read agent config files** (if in Jarvis project):
   - `/ORCHESTRATOR.md` - Swarm rules & delegation matrix
   - `/GEMINI.md`, `/CLAUDE.md`, `/CODEX.md` - Agent-specific directives

2. **Check task type** and match to best agent:
   - UI/animations/i18n/images → **Gemini 3 Pro**
   - Architecture/security/complex → **Claude 4 Opus**
   - Debugging/testing/API → **GPT 5.2 Codex**

3. **Consider swarm mode** if:
   - ≥3 independent tasks
   - Multi-file modifications
   - Large features (UI + API + docs)

4. **Use masterscript** for delegation:
   ```bash
   node scripts/masterscript.mjs "task" --model gemini:pro
   node scripts/masterscript.mjs "task" --swarm
   ```

5. **Fallback is automatic** - masterscript will use alternatives if preferred agent unavailable.

6. **Tests are mandatory** - Every code change needs tests.
