# 🧪 Test des Agents Locaux

## Test Gemini CLI

```bash
# Test simple
npm run delegate "Hello, test Gemini connection"

# Test avec différentes complexités
npm run delegate "fix simple typo"           # → gemini-2.0-flash-exp (low)
npm run delegate "fix lint errors"           # → gemini-2.0-flash-exp (standard)
npm run delegate "implement new feature"     # → gemini-2.0-flash-exp (high)
npm run delegate "design architecture"       # → gemini-2.0-pro-exp (standard)
```

## Test Codex CLI

```bash
# Test simple
npm run delegate "Hello, test Codex" --provider codex

# Test avec différentes complexités
npm run delegate "format code" --provider codex              # → gpt-5-nano
npm run delegate "write unit tests" --provider codex         # → gpt-5.1-codex
npm run delegate "refactor module" --provider codex          # → gpt-5.1-codex-max
npm run delegate "critical production fix" --provider codex  # → gpt-5.2-codex
```

## Test Agents Parallèles

```bash
# Exemple: Traduire 3 pages en parallèle
npm run parallel \
  "translate app/page.tsx to French" \
  "translate app/about/page.tsx to French" \
  "translate app/contact/page.tsx to French"
```

**Résultat attendu :**
- 3 agents Gemini lancés simultanément
- Chacun avec son propre terminal visible
- Tracking dans `.memory/projects/jarvis/gemini.json`
- Visible sur le dashboard en temps réel

## Vérification Dashboard

Après les tests, ouvre :
```
https://jarvis.atelier-sam.fr/memory
```

- Switch sur "💻 CLIs Locaux"
- Tu devrais voir toutes les tâches
- Avec les bons modèles (flash, pro, etc.)

## Prochaine Étape

Une fois les tests validés, on pourra :
1. Créer le dashboard Mission Control (`jarvis.atelier-sam.fr/`)
2. Créer les vues par projet (`jarvis.atelier-sam.fr/atelier-web`)
3. Ajouter le tracking de quota
