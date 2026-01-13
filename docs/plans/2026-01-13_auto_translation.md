# 🌐 Jarvis Auto-Translation System (i18n)

## Objectif
Quand une nouvelle clé est ajoutée dans `messages/fr.json`, le système traduit automatiquement vers les 7 autres langues en parallèle.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ 1. WATCHER                                                  │
│    Surveille: web/messages/*.json                           │
│    Action: Détecte nouveaux commits ou saves                │
└───────────────────────┬─────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. DIFF EXTRACTOR                                           │
│    Compare: fr.json (source) vs autres langues              │
│    Output: Liste des clés manquantes par langue             │
└───────────────────────┬─────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. SWARM TRANSLATION                                        │
│    Agent 1 → en.json                                        │
│    Agent 2 → es.json, de.json                               │
│    Agent 3 → it.json, pt.json, ja.json, zh.json             │
└───────────────────────┬─────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. VALIDATION PIPELINE                                      │
│    - JSON Schema validation                                 │
│    - Build test (next build --dry-run)                      │
│    - Key consistency check                                  │
└───────────────────────┬─────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. AUTO-COMMIT & DASHBOARD LOG                              │
│    ✅ Si OK: git commit -m "🌐 i18n: +X keys"               │
│    ❌ Si échec: Alerte orchestrateur + dashboard            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Fichiers à Créer

| Fichier | Description |
|---------|-------------|
| `scripts/i18n-watcher.mjs` | Surveille messages/*.json |
| `scripts/i18n-diff.mjs` | Extrait clés manquantes |
| `scripts/i18n-translate.mjs` | Exécute traduction swarm |
| `scripts/i18n-validate.mjs` | Valide traductions |
| `.config/i18n.json` | Configuration utilisateur |

---

## ⚙️ Configuration Utilisateur

```json
// jarvis.config.json ou .config/i18n.json
{
  "i18n": {
    "enabled": true,
    "sourceLang": "fr",
    "targetLangs": ["en", "es", "de", "it", "pt", "ja", "zh"],
    "watchMode": "git-hook" | "fs-watch",
    "autoCommit": true,
    "validationLevel": "strict" | "relaxed"
  }
}
```

---

## 🔧 Scripts

### 1. i18n-diff.mjs
```javascript
// Extrait les clés manquantes
export function findMissingKeys(sourceLang, targetLang) {
  const source = JSON.parse(fs.readFileSync(`messages/${sourceLang}.json`))
  const target = JSON.parse(fs.readFileSync(`messages/${targetLang}.json`))
  
  const missing = {}
  for (const [section, keys] of Object.entries(flattenKeys(source))) {
    if (!getNestedValue(target, section)) {
      missing[section] = keys
    }
  }
  return missing
}
```

### 2. i18n-translate.mjs (Swarm Mode)
```javascript
// Traduit les clés manquantes en parallèle
async function translateMissingKeys(missingByLang) {
  const agents = [
    { model: 'gemini:flash', langs: ['en'] },
    { model: 'claude:sonnet', langs: ['es', 'de'] },
    { model: 'gemini:flash', langs: ['it', 'pt', 'ja', 'zh'] }
  ]
  
  return Promise.all(agents.map(agent => 
    translateWithAgent(agent.model, missingByLang, agent.langs)
  ))
}
```

---

## ✅ Validation Pipeline

1. **JSON Parse**: Vérifie syntaxe JSON valide
2. **Schema Check**: Même structure que source
3. **Key Consistency**: Toutes les clés présentes
4. **Build Test**: `npm run build --dry-run`
5. **Length Check**: Traduction pas trop longue/courte

---

## 🔄 Fallback

| Problème | Action |
|----------|--------|
| Agent timeout | Retry avec autre agent |
| Traduction invalide | Garder clé originale (fr) + alerte |
| Build échoue | Rollback + notification |

---

## 📊 Dashboard Integration

- Log en temps réel des traductions
- Historique des clés ajoutées
- Alerte si validation échoue
- Stats: clés par langue, temps moyen

---

## 🚀 Commandes CLI

```bash
# Activer le watcher
jarvis i18n --watch

# Traduire manuellement
jarvis i18n --translate

# Vérifier cohérence
jarvis i18n --check

# Voir diff
jarvis i18n --diff
```

---

## 📅 Phases d'Implémentation

### Phase 1: Core (MVP)
- [ ] i18n-diff.mjs
- [ ] i18n-translate.mjs (simple, sans swarm)
- [ ] i18n-validate.mjs

### Phase 2: Automation
- [ ] i18n-watcher.mjs
- [ ] Git hook integration
- [ ] Auto-commit

### Phase 3: Dashboard
- [ ] Logs temps réel
- [ ] Historique
- [ ] Alertes
