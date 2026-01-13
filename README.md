# 🧠 Jarvis - AI Orchestration Platform

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

> **Orchestrez vos agents IA locaux (Gemini, Claude, Codex) depuis une plateforme unifiée.**
> 
> Jarvis se connecte à vos CLIs installés localement et vous offre un dashboard centralisé pour suivre vos quotas, projets et tâches.

---

## 🚀 Quick Start (3 minutes)

### 1. Installez le SDK Jarvis

```bash
npm install -g @jarvis/cli
```

### 2. Connectez-vous à la plateforme

```bash
jarvis login
# Ouvre votre navigateur vers jarvis.atelier-sam.fr pour l'authentification
```

### 3. Vérifiez vos CLIs locaux

```bash
jarvis status
```

```
┌─────────────────────────────────────────────────────┐
│  🧠 JARVIS STATUS                                   │
├─────────────────────────────────────────────────────┤
│  Gemini CLI    ● Connected    (Flash/Pro ready)    │
│  Claude CLI    ● Connected    (Sonnet ready)       │
│  Codex CLI     ○ Not found    (run: jarvis setup)  │
├─────────────────────────────────────────────────────┤
│  Quotas: 89% Gemini | 72% Claude | -- OpenAI       │
│  Dashboard: jarvis.atelier-sam.fr                  │
└─────────────────────────────────────────────────────┘
```

### 4. Déléguez votre première tâche

```bash
jarvis delegate "Fix the login bug in auth.ts" --model gemini:pro
```

---

## ✨ Ce que Jarvis vous offre

### 🎛️ Dashboard Centralisé
Accédez à [jarvis.atelier-sam.fr](https://jarvis.atelier-sam.fr) pour :
- **Voir vos projets** et leur état de synchronisation
- **Suivre vos quotas** Gemini, Claude et OpenAI en temps réel
- **Gérer vos tâches** et leur historique
- **Visualiser vos CLIs** connectés ou non

### 🔄 Délégation Intelligente
```bash
jarvis delegate "Refactor the API routes" --model claude:sonnet
jarvis delegate "Write unit tests" --model codex
jarvis delegate "Generate documentation" --model gemini:flash
```

### 🐝 Mode Swarm (Parallélisation)
```bash
jarvis delegate "Complete site redesign" --swarm
# Décompose automatiquement en sous-tâches parallèles
```

### 📊 Suivi des Quotas
Ne soyez plus jamais surpris par vos limites API. Le dashboard affiche en temps réel votre consommation Gemini, Claude et OpenAI.

---

## 📸 Dashboard

<p align="center">
  <img src="./assets/dashboard-preview.png" alt="Jarvis Dashboard" width="100%" style="border-radius: 10px;">
</p>

> 🚀 **Live Demo:** [jarvis.atelier-sam.fr](https://jarvis.atelier-sam.fr)

---

## 🛠️ Commandes CLI

| Commande | Description |
| :--- | :--- |
| `jarvis login` | Connecte votre machine à la plateforme |
| `jarvis status` | Affiche l'état de vos CLIs et quotas |
| `jarvis setup` | Installe automatiquement les CLIs manquants |
| `jarvis delegate "<task>"` | Délègue une tâche à un agent IA |
| `jarvis sync` | Synchronise votre projet avec le dashboard |

---

## 📋 Prérequis

- **Node.js 18+** 
- **Au moins un CLI AI installé :**
  - [Gemini CLI](https://github.com/google/gemini-cli) - `npm i -g @google/gemini-cli`
  - [Claude CLI](https://github.com/anthropics/claude-cli) - Via Homebrew ou pip
  - [Codex CLI](https://github.com/openai/codex-cli) - `npm i -g @openai/codex`

> 💡 **Astuce :** Utilisez `jarvis setup` pour installer automatiquement les CLIs manquants !

---

## 🏢 Pour les utilisateurs avancés

Vous souhaitez héberger votre propre instance Jarvis ? Consultez notre [Guide d'auto-hébergement](./docs/SELF_HOSTING.md).

---

## 📄 License

MIT License - Voir [LICENSE](./LICENSE)

---

<div align="center">
  <sub>🏔️❤️ En train de faire une côte, vive l'aventure 🏔️❤️</sub>
  <br>
  <sub>par Sam Sam</sub>
</div>
