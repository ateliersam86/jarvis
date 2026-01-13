# 🏗️ Architecture Jarvis - Multi-Machine avec Shared Memory

## Vision Globale

Jarvis sert de **pont centralisé** entre plusieurs machines de développement, avec Server comme source de vérité pour la mémoire partagée.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    UNRAID SERVER (Hub Central)                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Redis (Context Sync)                                   │  │
│  │  ├─ jarvis:auth:google:tokens                          │  │
│  │  ├─ jarvis:memory:shared (GEMINI.md sync)              │  │
│  │  └─ jarvis:sessions:* (Historique conversations)       │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  File System (Source de Vérité)                        │  │
│  │  ├─ GEMINI.md (Shared Memory pour tous les CLIs)       │  │
│  │  ├─ .codex/config.toml (Config Codex)                  │  │
│  │  ├─ brain/ (Conversations Antigravity)                 │  │
│  │  └─ web/prisma/dev.db (Historique chat Jarvis)         │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Jarvis Workers (Swarm)                                │  │
│  │  ├─ jarvis-worker-gemini (Online)                      │  │
│  │  ├─ jarvis-worker-chatgpt (Online)                     │  │
│  │  └─ jarvis-worker-claude (Offline - needs API key)     │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
           ↕ Sync bidirectionnel (rsync + Redis)
┌──────────────────────────────────────────────────────────────┐
│                    MAC LOCAL (Machine Dev 1)                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Antigravity Opus 4.5 (Orchestrateur Principal)        │  │
│  │  ├─ Architecture & Design                              │  │
│  │  ├─ Code complexe multi-fichiers                       │  │
│  │  └─ Décisions créatives                                │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  CLIs Locaux (Quota Infini)                            │  │
│  │  ├─ Gemini CLI (Lint/Type/Docs)                        │  │
│  │  ├─ Codex CLI (Tests/Commits)                          │  │
│  │  └─ Auto-Healer (Détection automatique)                │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Sync Local                                             │  │
│  │  ├─ ./sync-to-unraid.sh (Push changes)                 │  │
│  │  ├─ ./pull-from-unraid.sh (Pull memory)                │  │
│  │  └─ Auto-sync on save (optionnel)                      │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
           ↕ Sync bidirectionnel
┌──────────────────────────────────────────────────────────────┐
│              AUTRE MACHINE (Bureau, Laptop, etc.)             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  1. Pull depuis Server                                  │  │
│  │     rsync -avz root@${JARVIS_SERVER_IP}:/mnt/user/...         │  │
│  │                                                          │  │
│  │  2. Récupère automatiquement:                           │  │
│  │     ✅ GEMINI.md (Shared Memory)                        │  │
│  │     ✅ .codex/config.toml                               │  │
│  │     ✅ Historique conversations (brain/)                │  │
│  │     ✅ Context Redis (via workers)                      │  │
│  │                                                          │  │
│  │  3. Continue le travail avec le même contexte           │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Workflows Automatiques

### 1. Développement Local avec Auto-Healing

```bash
# Terminal 1: Watcher automatique
npm run auto-heal:watch

# Terminal 2: Dev server
cd web && npm run dev

# Workflow:
# 1. Tu codes
# 2. Auto-healer détecte erreurs lint/type
# 3. Délègue automatiquement à Gemini CLI
# 4. Gemini lit GEMINI.md (context)
# 5. Fix les erreurs
# 6. Sync automatique vers Server
```

### 2. Changement de Machine

```bash
# Sur nouvelle machine
git clone <repo>
./pull-from-unraid.sh  # Récupère GEMINI.md, brain/, etc.

# Maintenant tu as:
# ✅ Même mémoire partagée (GEMINI.md)
# ✅ Même historique conversations
# ✅ Même config CLIs
# ✅ Accès aux workers Jarvis via Redis
```

### 3. Utilisation des Workers Jarvis (via Web UI)

```
1. Ouvre https://jarvis.atelier-sam.fr
2. Chat avec Gemini/ChatGPT workers
3. Historique sauvegardé dans Redis + SQLite
4. Accessible depuis n'importe quelle machine
```

## Fichiers Clés

### GEMINI.md (Shared Memory)
- **Location:** `/Users/samuelmuselet/Jarvis/GEMINI.md`
- **Syncé vers:** `/mnt/user/websites/jarvis-nexus/GEMINI.md`
- **Utilisé par:** Gemini CLI, Workers Gemini
- **Contenu:** Context projet, rôle, tech stack

### .codex/config.toml
- **Location:** `/Users/samuelmuselet/Jarvis/.codex/config.toml`
- **Utilisé par:** Codex CLI
- **Contenu:** Config tests, commits, sandbox

### brain/ (Antigravity)
- **Location:** `~/.gemini/antigravity/brain/`
- **Contenu:** Conversations, artifacts, knowledge items
- **Sync:** Optionnel (peut être syncé vers Server)

## Scripts Disponibles

```bash
# Delegation
npm run delegate "fix lint errors"
npm run delegate:dry "write tests"

# Auto-healing
npm run auto-heal          # Check once
npm run auto-heal:watch    # Continuous monitoring
npm run auto-heal:fix      # Fix detected errors

# Sync
./sync-to-unraid.sh        # Push local → Server
./pull-from-unraid.sh      # Pull Server → local
```

## Avantages de cette Architecture

1. **Mémoire Partagée Centralisée**
   - `GEMINI.md` sur Server = source de vérité
   - Tous les CLIs lisent le même context
   - Cohérence entre machines

2. **Quota Optimization**
   - Gemini/Codex CLI = ∞ quota
   - Opus réservé pour tâches complexes
   - 60-80% économies attendues

3. **Multi-Machine**
   - Travaille sur Mac, continue sur PC
   - Même context, même historique
   - Redis sync en temps réel

4. **Automatisation**
   - Auto-healer détecte et fix
   - Pas besoin de dire "j'ai des erreurs"
   - Délégation intelligente

## Prochaines Étapes

1. ✅ Masterscript créé
2. ✅ GEMINI.md syncé
3. ✅ Workers Jarvis online (Gemini + ChatGPT)
4. 🔄 Créer `pull-from-unraid.sh`
5. 🔄 Tester auto-healer
6. 🔄 Ajouter `context7/conductor` (optionnel)
