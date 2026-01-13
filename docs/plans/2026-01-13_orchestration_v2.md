# 🧠 Jarvis Orchestration v2.0 - Plan d'Amélioration

## Problèmes Identifiés
1. **Incohérence Gemini/Orchestrateur** - Les agents ont chacun leur méthodologie
2. **Pas de vérification de cohérence** entre propositions multi-agents
3. **Temps perdu** sur tâches simples avec contrôle trop lourd
4. **Pas de visibilité** sur la réflexion des agents en cours
5. **Pas de timeout** si un agent est bloqué

---

## 🎛️ Nouveaux Modes d'Exécution

### Mode 1: SWARM (Existant - Amélioré)
> Tâches parallèles différentes

```bash
jarvis "..." --swarm
```
- Chaque agent reçoit une sous-tâche spécifique
- Exécution parallèle
- Agrégation des résultats

---

### Mode 2: REFLECT (Nouveau)
> Même prompt, perspectives multiples

```bash
jarvis "..." --reflect           # 2 agents par défaut
jarvis "..." --reflect --agents=3  # 3 agents pour grosses missions
```
- **Même prompt** envoyé à 2-3 agents (configurable)
- Chaque IA donne **sa propre interprétation**
- L'orchestrateur compare et extrait la **meilleure synthèse**
- Usage: Décisions architecturales, brainstorming, choix technologiques

**Output obligatoire:**
- 📟 **Terminal**: Logs résumés en temps réel
- 🌐 **Dashboard**: Historique complet + visualisation

**Avantage**: Diversité de perspectives, meilleure décision finale

---

### Mode 3: SYNERGY (Nouveau - Combiné)
> Réflexion collective puis production

```bash
jarvis "..." --synergy
```

**Phase 1 - REFLECT**: Tous les agents brainstorment
**Phase 2 - Validation**: Orchestrateur vérifie cohérence
**Phase 3 - SWARM**: Sous-tâches parallèles basées sur consensus

**⚠️ Quota élevé**: Demande confirmation avant exécution

---

## ✅ Système de Cohérence

### Vérification Inter-Agents
Après chaque exécution multi-agents:

1. **Extraction des méthodologies** de chaque agent
2. **Détection des contradictions** entre propositions
3. **Questions de clarification** si incohérences
4. **Score de cohérence** global (0-100%)

```
┌─────────────────────────────────────────────┐
│ Coherence Check                             │
├─────────────────────────────────────────────┤
│ ✅ Architecture: Consistent (3/3 agree)     │
│ ⚠️ Naming: Minor diff (claude vs gemini)   │
│ ❌ API Design: Conflict detected            │
│                                             │
│ Overall: 78% coherent                       │
│ Action: Requesting clarification on API...  │
└─────────────────────────────────────────────┘
```

---

## ⏱️ Système de Timeout & Monitoring

### Timeout Intelligent
- **30s** : Première alerte (agent lent)
- **60s** : Warning + proposition de fallback
- **120s**: Kill automatique + retry avec autre agent

### Progress Feedback en Temps Réel
```
╔════════════════════ AGENT PROGRESS ═══════════════════╗
║ 🟢 Gemini Pro    │ Analyzing... │ 12s │ ████░░░░ 45% ║
║ 🟡 Claude        │ Writing...   │ 28s │ ██████░░ 70% ║
║ 🔴 Codex         │ Stuck?       │ 45s │ ██░░░░░░ 20% ║
╠════════════════════════════════════════════════════════╣
║ [S]kip Codex | [R]etry | [W]ait                        ║
╚════════════════════════════════════════════════════════╝
```

---

## 📊 Agent Performance Analytics

### Métriques Collectées
| Métrique | Description |
|----------|-------------|
| `avg_time` | Temps moyen de réponse |
| `success_rate` | Taux de réussite |
| `task_affinity` | Affinité par type de tâche |
| `cost_efficiency` | Ratio qualité/tokens |

### Scoring par Type de Tâche
```json
{
  "ui_component": { "gemini": 95, "claude": 70, "codex": 40 },
  "debugging": { "gemini": 60, "claude": 85, "codex": 90 },
  "architecture": { "gemini": 80, "claude": 95, "codex": 50 }
}
```

L'orchestrateur choisira automatiquement le meilleur agent selon le type.

---

## 🎚️ Contrôle Adaptatif

### Niveau d'importance
- **LOW**: Exécution directe, pas de validation
- **MEDIUM**: Validation légère, timeout court
- **HIGH**: Mode SYNERGY, validation complète

```bash
jarvis "fix typo" --importance=low    # Direct execute
jarvis "refactor auth" --importance=high --synergy  # Full process
```

---

## 📋 Fichiers à Créer/Modifier

| Fichier | Action |
|---------|--------|
| `scripts/masterscript.mjs` | Ajouter modes REFLECT, SYNERGY |
| `scripts/coherence-check.mjs` | Nouveau: vérification cohérence |
| `scripts/agent-analytics.mjs` | Nouveau: analyse performance |
| `scripts/timeout-handler.mjs` | Nouveau: gestion timeouts |
| `.config/agents/agent-scores.json` | Scores par type de tâche |

---

## 🔐 Validation Quota

Pour les modes coûteux (REFLECT, SYNERGY):
```
⚠️ Ce mode utilise ~3x plus de tokens.
   Estimation: ~15,000 tokens

Continuer? [Y/n]:
```

---

## 📅 Prochaines Étapes

1. [ ] Implémenter mode REFLECT
2. [ ] Implémenter mode SYNERGY  
3. [ ] Système de cohérence
4. [ ] UI temps réel des agents
5. [ ] Analytics performance
6. [ ] Timeout intelligent
