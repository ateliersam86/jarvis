# 🎯 Architecture Mémoire avec Conductor

## Fichiers de Mémoire Unifiés

### 1. `PROJECT_MEMORY.md` (Remplace GEMINI.md)
**Rôle:** Mémoire unifiée du projet, lisible par tous les agents  
**Contenu:**
- Vue d'ensemble du projet
- Tech stack
- État actuel (workers online/offline)
- Patterns d'architecture
- Issues connues
- Workflow de développement

**Utilisé par:**
- Antigravity Opus (orchestrateur)
- Gemini CLI (via Masterscript)
- Codex CLI (via Masterscript)
- Toi (référence rapide)

### 2. `.conductor/state.json`
**Rôle:** État d'orchestration et tracking de progression  
**Contenu:**
- Tâches complétées/en cours/bloquées
- État des workers
- Stratégie de délégation
- Métriques d'optimisation quota

**Utilisé par:**
- context7/conductor extension (VS Code)
- Antigravity Opus (pour décisions)
- Auto-healer (pour éviter duplication)

### 3. `.codex/config.toml`
**Rôle:** Configuration spécifique Codex CLI  
**Contenu:**
- Settings tests
- Templates commits
- Sandbox policies

## Workflow avec Conductor

```
1. Tu parles à Antigravity Opus
   ↓
2. Opus lit PROJECT_MEMORY.md + .conductor/state.json
   ↓
3. Opus décide: déléguer ou faire lui-même
   ↓
4. Si délégation → Masterscript → CLI approprié
   ↓
5. CLI lit PROJECT_MEMORY.md pour contexte
   ↓
6. Résultat → Mise à jour .conductor/state.json
   ↓
7. Sync vers Unraid
```

## Installation Conductor

```bash
# Dans VS Code
code --install-extension context7.conductor

# Ou via VS Code UI:
# Extensions → Rechercher "Conductor" → Installer
```

## Avantages vs GEMINI.md

| Aspect | GEMINI.md (Ancien) | PROJECT_MEMORY.md (Nouveau) |
|--------|-------------------|----------------------------|
| Scope | Spécifique Gemini | Tous les agents |
| Format | Markdown simple | Markdown structuré |
| Tracking | Aucun | Via .conductor/state.json |
| Multi-agent | Non | Oui |
| Conductor | Non compatible | Compatible |

## Prochaines Étapes

1. ✅ Créer `PROJECT_MEMORY.md`
2. ✅ Créer `.conductor/state.json`
3. ✅ Mettre à jour scripts (masterscript, pull)
4. 🔄 Installer extension Conductor
5. 🔄 Tester workflow complet
6. 🔄 Sync vers Unraid
