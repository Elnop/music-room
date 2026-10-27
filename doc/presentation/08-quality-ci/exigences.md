# IV.8 Agilité, qualité et intégration continue

## Ce que dit le sujet

> *"You have a lot of layers and functionalities to implement for this project, and you will have to work in a team. You should arrange yourself to show agility, to be able to question your own decisions, and to set specific one-off tests for each layer."*

> *"For obvious security reasons, any credentials, API keys, env variables etc... must be saved locally in a .env file and ignored by git. Publicly stored credentials will lead you directly to a failure of the project."*

## Ce qu'on livre

- **Agilité** : épics, stories et bugs dans GitHub Issues, sur le board « Music Room – Validation » (Todo → In Progress → Review → Done). Chaque ticket a sa branche et sa pull request vers `develop`, et le statut des tickets avance automatiquement.
- **Remise en question des décisions** : [decisions.md](../../decisions.md) garde les choix, les alternatives et les décisions revues en chemin. Exemples : la refonte du code (épic #362), le passage des positions entières aux rangs fractionnaires pour la concurrence (épic #85).
- **Des tests par couche** :
  - backend : tests unitaires Vitest et tests d'intégration Supertest, sur une vraie stack Supabase, Redis et Socket.io ;
  - mobile : stores, hooks et composants avec jest-expo ;
  - charge : `make perf-test`.
- **Garde-fous** : `npm run check` lance types, lint, code mort, dépendances, duplication, semgrep, ast-grep, gitleaks et tests. Il tourne avant chaque commit (husky) et en CI sur chaque PR. Les règles ne peuvent que se durcir.
- **Secrets** : seulement dans les `.env` ignorés par git ; gitleaks bloque un secret commité.

## Où regarder

- [quality-and-ci.md](../../development/quality-and-ci.md), [testing.md](../../development/testing.md)
- `.github/workflows/ci.yml`, `.husky/pre-commit`, `.agents/rules/`

## Scénario

- [scenario-ci.md](scenario-ci.md)
