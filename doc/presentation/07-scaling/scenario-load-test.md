# Scénario : mesurer la charge

**Prouve** : IV.7, *"justify and measure the number of users that can simultaneously use your 3 services"* et *"specify the servers characteristics"*.

**Prérequis** :

- backend lancé (`make dev-docker`), Docker démarré ;
- `RATE_LIMIT_ENABLED=false` dans `backend/.env` pour le temps du test, puis backend redémarré. Sinon le limiteur d'authentification fausse la mesure ([conditions](../../../tests/performance/README.md#conditions-that-change-the-numbers)) ;
- remettre `true` après le test.

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 1 | Sur la machine de référence : `nproc`, `lscpu \| head`, `free -h` | Les caractéristiques que le sujet demande (*"CPU, RAM, Cloud or Premise"*) : la machine locale, celle-là même qui fait tourner la démo | ☐ |
| 2 | `make perf-test` | Les fixtures sont créées (utilisateurs `perf-*`, amitiés, licence, playlist partagée), puis les scénarios HTTP et Socket.io s'exécutent | ☐ |
| 3 | Ouvrir `tests/performance/results/<horodatage>/summary.md` | Requêtes par seconde et latences par endpoint, codes de retour, section Socket.io (connexions, latence de diffusion, latence de contrôle) | ☐ |
| 4 | `make perf-test PERF_SOCKET_CLIENTS=60` | La latence de diffusion monte avec le nombre de clients de la room (N clients, environ N²/2 livraisons par seconde) | ☐ |
| 5 | Montrer le rapport de capacité (#106) | Nombre maximal d'utilisateurs simultanés sur la machine de référence, et sa justification | ☐ |

**À dire** :

- Les `409` du scénario d'édition sont **attendus** : c'est la concurrence de IV.2.3 qui fonctionne.
- Le chiffre doit rester cohérent avec la machine (*"Dozens for a Raspberry, thousands for a low-end server"*).
