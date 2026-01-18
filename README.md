# 🧠 Jarvis

### L'Orchestrateur Multi-Agent pour une IA qui vous comprend

[![npm](https://img.shields.io/npm/v/jarvis-orchestrator?color=orange)](https://www.npmjs.com/package/jarvis-orchestrator)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Dashboard](https://img.shields.io/badge/dashboard-online-success)](https://jarvis.atelier-sam.fr)

---

## 🚀 Installation

```bash
npm install -g jarvis-orchestrator
```

---

## ✨ Utilisation

```bash
jarvis "Refactore ce module et ajoute des tests"
```

C'est tout. Jarvis analyse, décompose, délègue et synthétise.

---

## 🎯 Les 4 Modes

### 🔹 Mode Direct (défaut)
Exécution simple avec l'agent le plus adapté.

```bash
jarvis "Analyse ce fichier et suggère des améliorations"
```

---

### 🐝 Mode Swarm
**Parallélisation multi-agents** pour les tâches complexes.

Jarvis décompose automatiquement votre demande en sous-tâches et les exécute simultanément sur plusieurs agents.

```bash
jarvis "Redesign complet du dashboard" --swarm
```

```
┌──────────────────────────────────────────────┐
│  🐝 SWARM MODE                               │
├──────────────────────────────────────────────┤
│  → Agent 1: Layout & Structure    [Gemini]   │
│  → Agent 2: Styling & Animations  [Gemini]   │
│  → Agent 3: Logic & State         [Claude]   │
│                                              │
│  ⚡ Exécution parallèle - 3x plus rapide    │
└──────────────────────────────────────────────┘
```

---

### 🪞 Mode Reflect
**Consensus multi-agents** pour les décisions importantes.

Interroge 2-3 agents en parallèle, compare leurs réponses, et synthétise le meilleur de chacun.

```bash
jarvis "Quelle architecture pour ce projet ?" --reflect
```

```
┌──────────────────────────────────────────────┐
│  🪞 REFLECT MODE                             │
├──────────────────────────────────────────────┤
│  Agent 1: Microservices + Event-driven       │
│  Agent 2: Monolithe modulaire               │
│  Agent 3: Serverless + Edge                 │
│                                              │
│  📊 Synthèse: Points communs + divergences   │
└──────────────────────────────────────────────┘
```

---

### 📋 Mode Plan-First
**Validation avant exécution** pour les opérations critiques.

L'agent décrit d'abord son plan d'action. Vous validez, puis il exécute.

```bash
jarvis "Migre la base de données vers PostgreSQL" --plan-first
```

```
┌──────────────────────────────────────────────┐
│  📋 PLAN-FIRST MODE                          │
├──────────────────────────────────────────────┤
│  Étape 1: Backup de la DB actuelle           │
│  Étape 2: Création du schéma PostgreSQL      │
│  Étape 3: Migration des données              │
│  Étape 4: Tests de validation                │
│                                              │
│  ✅ Approuver?  [Y/n]                        │
└──────────────────────────────────────────────┘
```

---

## 🔧 Options Avancées

### Injection de Contexte
Donnez plus de contexte à l'agent en incluant des fichiers :

```bash
jarvis "Ajoute un loading state" --include src/Stats.tsx,src/types.ts
```

### Choix du Modèle
Forcez un modèle spécifique :

```bash
jarvis "..." --model gemini:pro     # Gemini Pro
jarvis "..." --model claude:opus    # Claude Opus (max intelligence)
jarvis "..." --model openai:codex   # Codex (debug/tests)
```

### Commandes Utilitaires

| Commande | Description |
|----------|-------------|
| `jarvis status` | État des agents + quotas |
| `jarvis setup` | Configure les CLIs AI |
| `jarvis chat` | Mode conversation |

---

## 🤖 Agents Supportés

| Agent | Spécialité | Quand l'utiliser |
|-------|------------|------------------|
| **Gemini** | UI, Design, Créativité | Pages, composants, CSS |
| **Claude** | Architecture, Logique | Refactoring, patterns |
| **Codex** | Tests, Debug | Tests unitaires, debug |

Jarvis choisit automatiquement le meilleur agent selon votre demande.

---

## 📊 Dashboard

Suivez vos projets, agents et quotas sur **[jarvis.atelier-sam.fr](https://jarvis.atelier-sam.fr)**

---

## 📋 Prérequis

- **Node.js 18+**
- **Au moins un CLI AI :**
  - [Gemini CLI](https://github.com/google/gemini-cli)
  - [Claude CLI](https://github.com/anthropics/claude-cli)
  - [Codex CLI](https://github.com/openai/codex-cli)

---

## 📝 License

MIT

---

<div align="center">
  <sub>🏔️❤️ Vive l'aventure 🏔️❤️</sub>
  <br>
  <sub>par <a href="https://atelier-sam.fr">Sam</a></sub>
</div>
