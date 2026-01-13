# 🧠 Jarvis - Multi-Agent AI Orchestrator

> **Orchestrez, déléguez et parallélisez vos tâches IA avec Gemini, Claude et Codex.**

[![Status](https://img.shields.io/badge/status-active-success.svg)](https://jarvis.atelier-sam.fr)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

---

## ⚡ Pourquoi Jarvis ?

**Vous utilisez plusieurs CLIs AI ?** Gemini CLI, Claude CLI, Codex... Chacun a ses forces, mais les gérer séparément est fastidieux.

**Jarvis résout ça :**
- 🎯 **Délégation intelligente** - Chaque tâche est assignée au meilleur agent
- 🐝 **Mode Swarm** - Parallélisez vos tâches sur plusieurs agents simultanément  
- 📊 **Suivi centralisé** - Quotas, statuts et historique en un seul endroit

---

## 🚀 Quick Start

```bash
# 1. Installez le CLI Jarvis
npm install -g @jarvis/cli

# 2. Connectez vos agents locaux
jarvis setup
# → Détecte et configure Gemini CLI, Claude CLI, Codex

# 3. Déléguez votre première tâche
jarvis delegate "Refactor auth.ts" --model gemini:pro
```

---

## 🎯 Délégation Intelligente

Jarvis choisit automatiquement l'agent optimal selon la tâche :

```bash
# UI/CSS → Gemini (rapide, créatif)
jarvis delegate "Create a modern login form" --auto

# Architecture/Logic → Claude (analytique)
jarvis delegate "Refactor the API structure" --auto

# Tests/Debug → Codex (précis, technique)
jarvis delegate "Write unit tests for utils.ts" --auto
```

**Ou spécifiez manuellement :**
```bash
jarvis delegate "..." --model gemini:flash
jarvis delegate "..." --model claude:sonnet
jarvis delegate "..." --model codex
```

---

## 🐝 Mode Swarm (Parallélisation)

Décomposez une tâche complexe en sous-tâches parallèles :

```bash
jarvis delegate "Complete site redesign" --swarm
```

```
┌─────────────────────────────────────────────────────┐
│  🐝 SWARM MODE - 4 agents en parallèle              │
├─────────────────────────────────────────────────────┤
│  Agent 1 (Gemini)  → Header + Navigation    ✓ Done  │
│  Agent 2 (Claude)  → Auth refactoring       ● 78%   │
│  Agent 3 (Gemini)  → Footer + Responsive    ● 45%   │
│  Agent 4 (Codex)   → Unit tests             ○ Queue │
├─────────────────────────────────────────────────────┤
│  Overall: 56% complete                              │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Dashboard (Optionnel)

Visualisez vos projets et quotas sur [jarvis.atelier-sam.fr](https://jarvis.atelier-sam.fr) :

<p align="center">
  <img src="./assets/dashboard-preview.png" alt="Jarvis Dashboard" width="100%">
</p>

---

## 🛠️ Commandes CLI

| Commande | Description |
| :--- | :--- |
| `jarvis setup` | Détecte et installe les CLIs manquants |
| `jarvis status` | Affiche l'état des agents et quotas |
| `jarvis delegate "<task>"` | Délègue une tâche (--auto, --swarm) |
| `jarvis login` | Connecte au dashboard (optionnel) |

---

## 📋 Prérequis

- **Node.js 18+**
- **Au moins un CLI AI local :**
  - [Gemini CLI](https://github.com/google/gemini-cli) 
  - [Claude CLI](https://github.com/anthropics/claude-cli)
  - [Codex CLI](https://github.com/openai/codex-cli)

---

## � License

MIT - [LICENSE](./LICENSE)

---

<div align="center">
  <sub>🏔️❤️ En train de faire une côte, vive l'aventure 🏔️❤️</sub>
  <br>
  <sub>par Sam Sam</sub>
</div>
