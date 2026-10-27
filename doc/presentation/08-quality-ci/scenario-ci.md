# Scénario : process, tests et CI

**Prouve** : II (*"dispatch the different tasks between your project team members"*), IV.8, *"show agility"*, *"question your own decisions"*, *"set specific one-off tests for each layer"* et *".env file and ignored by git"*.

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 1 | Ouvrir le board GitHub « Music Room – Validation » | Des colonnes Todo → Done, des épics découpés en stories | ☐ |
| 1b | Filtrer les issues fermées par assigné (`gh issue list --state closed --assignee <login>`) | La répartition des tâches entre les membres de l'équipe (II) | ☐ |
| 2 | Ouvrir une PR fusionnée récente | Branche `<n>-<slug>`, `Closes #<n>`, CI verte, revue | ☐ |
| 3 | Ouvrir [decisions.md](../../decisions.md) §2 et §4 | Des décisions revues en cours de route, avec leur raison | ☐ |
| 4 | `make test` | Les tests backend (Vitest) et mobile (jest-expo) passent | ☐ |
| 5 | `make test-int` | Les tests d'intégration passent sur une stack Supabase, Redis et Socket.io réelle | ☐ |
| 6 | `cd backend && npm run check` | Tous les garde-fous passent | ☐ |
| 7 | Onglet **Actions** du dépôt | Les jobs `lint`, `type-check`, `test`, `check` et `test-int` tournent sur chaque PR | ☐ |
| 8 | `git log --all --oneline -- '*.env'` et `git check-ignore backend/.env mobile/.env` | Aucune sortie pour le premier : aucun `.env` n'a jamais été commité. Le second confirme que les deux fichiers sont ignorés | ☐ |

**À dire** : un test par couche. Exemples à montrer :

- règle métier : `playlist.permissions.test.ts` ;
- base de données et concurrence : `track-operations.int.test.ts` ;
- temps réel : `music-control-access.int.test.ts` ;
- client : `authStore.test.ts`.
