# IV.7 Montée en charge

## Ce que dit le sujet

> *"You must be able to evaluate the load your API and your back-end can support, that is, justify and measure the number of users that can simultaneously use your 3 services. You can use AB (Apache Benchmark), Gatling, Siege, Tsung, JMeter for instance."*

> *"Don't forget to specify the servers characteristics (CPU, RAM, Cloud or Premise, etc.). The maximum number of users should be consistent with the platform choice. Dozens for a Raspberry, thousands for a low-end server."*

## Ce qu'on livre

- **`make perf-test`** lance les tests de charge depuis le dépôt :
  - deux scénarios HTTP **Artillery** : connexion et lecture ; ajout, déplacement et suppression de titres sous contention ;
  - un scénario **Socket.io** propre au projet, qui fait éditer une playlist en direct et envoie des commandes de délégation.
- **Résultat** : un résumé `results/<horodatage>/summary.md` avec, par endpoint, les requêtes par seconde et les latences (médiane, p95, p99), les codes de retour et les conditions du test.
- **Pourquoi un script maison pour Socket.io** : ab, Gatling, Siege, Tsung et JMeter parlent HTTP, pas le protocole Socket.io. Les utilisateurs virtuels d'Artillery sont éphémères : ils ne peuvent ni garder un appareil cible en ligne pendant tout le test, ni mesurer une diffusion déclenchée par l'action d'un autre utilisateur.
- **« Vos 3 services »** : Zumik en livre deux (Playlist Editor et Control Delegation), ce sont donc ces deux-là qui sont mesurés.

## Où regarder

- [tests/performance/README.md](../../../tests/performance/README.md) : déroulé, variables, conditions qui changent les chiffres
- `tests/performance/scenarios/`, `backend/src/test/perf-socket.ts`

## Scénario

- [scenario-load-test.md](scenario-load-test.md)

## Écarts assumés

- **Machine de référence et rapport de capacité encore ouverts** : #103 et #106. La machine de référence est celle de la soutenance : avant la correction, il faut y avoir mesuré et décrit (CPU, RAM, local) le nombre maximal d'utilisateurs simultanés. Sans cela, l'exigence *"measure the number of users"* n'est pas remplie.
