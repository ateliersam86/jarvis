# 🚀 Guide d'Utilisation des Workers Jarvis

## Vue d'Ensemble

Tu as maintenant **3 façons** de déléguer du travail aux AI workers :

### 1. Via l'Interface Web Jarvis (Recommandé)
**URL :** `https://jarvis.atelier-sam.fr`

**Avantages :**
- ✅ Interface visuelle
- ✅ Historique des conversations
- ✅ Mémoire automatique par projet
- ✅ Quota tracking en temps réel

**Comment utiliser :**
1. Ouvre `https://jarvis.atelier-sam.fr`
2. Sélectionne le projet (🤖 Jarvis ou 🎨 Atelier-Sam)
3. Choisis un worker (Gemini, ChatGPT, Claude)
4. Pose ta question ou demande une tâche
5. Le worker met à jour automatiquement `.memory/projects/<project>/<worker>.json`

### 2. Via Masterscript (CLI Local)
**Commande :** `npm run delegate "ta tâche"`

**Avantages :**
- ✅ Rapide depuis le terminal
- ✅ Routing automatique (lint → Gemini, tests → Codex)
- ✅ Lit `PROJECT_MEMORY.md` automatiquement

**Limitations actuelles :**
- ⚠️ Gemini CLI nécessite configuration API key
- ⚠️ Codex CLI nécessite configuration

**Exemple :**
```bash
npm run delegate "Fix TypeScript errors in web/app/memory/page.tsx"
# → Route automatiquement vers Gemini CLI
```

### 3. Via Moi (Antigravity Opus)
**Avantages :**
- ✅ Tâches complexes multi-fichiers
- ✅ Architecture et design
- ✅ Refactoring avancé
- ✅ Je lis automatiquement le projet actif

**Quand m'utiliser :**
- Architecture de nouvelles features
- Refactoring complexe
- Décisions de design
- Debugging difficile

## Système Multi-Projet

### Changer de Projet

**Via l'interface web :**
1. Clique sur le sélecteur en haut à gauche (ex: "🤖 Jarvis AI Nexus ▼")
2. Sélectionne le projet désiré
3. La page se rafraîchit avec le nouveau contexte

**Automatique pour les workers :**
- Les workers Docker lisent `.memory/active_project.json` au démarrage
- Ils chargent automatiquement `.memory/projects/<project>/<worker>.json`
- Toutes les tâches sont trackées dans le bon projet

### Structure des Projets

```
.memory/
├── active_project.json          # Projet actuellement actif
├── projects.json                # Liste de tous les projets
└── projects/
    ├── jarvis/
    │   ├── PROJECT_MEMORY.md    # Contexte projet Jarvis
    │   ├── conductor_state.json # État orchestration
    │   ├── gemini.json          # Mémoire worker Gemini
    │   ├── claude.json          # Mémoire worker Claude
    │   └── chatgpt.json         # Mémoire worker ChatGPT
    └── atelier-sam/
        ├── PROJECT_MEMORY.md    # Contexte projet Atelier-Sam
        ├── gemini.json
        ├── claude.json
        └── chatgpt.json
```

## Exemples d'Utilisation

### Exemple 1 : Fix Lint Errors (Jarvis)

**Via Web UI :**
1. Sélectionne projet "🤖 Jarvis"
2. Ouvre chat avec Gemini
3. "Fix all ESLint errors in swarm/worker.js"

**Via Masterscript :**
```bash
npm run delegate "Fix ESLint errors in swarm/worker.js"
```

### Exemple 2 : Update Portfolio (Atelier-Sam)

**Via Web UI :**
1. Sélectionne projet "🎨 Atelier-Sam"
2. Ouvre chat avec Gemini
3. "Add a new chapter for Japan travel photos"

**Via Antigravity (moi) :**
Tu me demandes directement, je lis automatiquement le projet actif.

### Exemple 3 : Monitoring en Temps Réel

**Dashboard Mémoire :**
1. Ouvre `https://jarvis.atelier-sam.fr/memory`
2. Sélectionne le projet
3. Vois en temps réel :
   - Tâches complétées par worker
   - Expertise de chaque worker
   - Performance (temps de réponse, tokens)
   - Historique des 10 dernières tâches

## Workflow Recommandé

### Pour Jarvis (Infrastructure)
1. **Tâches simples** → Gemini via Web UI
2. **Tests** → ChatGPT via Web UI
3. **Architecture** → Moi (Antigravity)

### Pour Atelier-Sam (Portfolio)
1. **Lint/Types** → Gemini via Web UI
2. **Nouvelles features** → Moi (Antigravity)
3. **Refactoring** → Moi (Antigravity)

## Avantages du Système

✅ **Séparation Claire**
- Chaque projet a sa propre mémoire
- Pas de confusion entre projets

✅ **Traçabilité**
- Historique complet par projet
- Stats de performance par worker

✅ **Multi-Machine**
- Sync via Server
- Continuité garantie

✅ **Automatique**
- Workers lisent le bon projet
- Moi aussi je lis le bon contexte

## Prochaines Étapes

1. **Teste le changement de projet** sur `https://jarvis.atelier-sam.fr/memory`
2. **Délègue une tâche** via l'interface web
3. **Vérifie la mémoire** mise à jour dans `.memory/projects/<project>/`

**Questions ?** Demande-moi ! 🚀
