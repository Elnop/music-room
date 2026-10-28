# Scénario : installation depuis un clone

**Prouve** : III.1 (*"dependencies must be automatically downloadable from a clone of your repo thanks to a Makefile"*), III.2.

**Prérequis** : Docker démarré, Node 22, une connexion Internet.

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 1 | `git clone` puis `ls backend mobile` | Ni `node_modules/` ni bibliothèque tierce dans le dépôt | ☐ |
| 2 | `git ls-files \| grep -c node_modules` | `0` | ☐ |
| 3 | `make install` | Installation des dépendances backend et mobile à partir des lockfiles commités | ☐ |
| 4 | `make help` | La liste des commandes (dev, tests, qualité, perf) s'affiche | ☐ |
| 5 | `make dev-docker` | Backend, Redis et Supabase local démarrent ; `curl localhost:3000/health` répond | ☐ |
| 6 | Ouvrir l'app sur le téléphone et parcourir les onglets (Accueil, Recherche, Playlists, Amis, Profil) | Toutes les actions du projet sont accessibles depuis l'app (III.2) | ☐ |
| 7 | Ouvrir [decisions.md](../../decisions.md) §1 | Pour chaque techno, les alternatives écartées et la raison | ☐ |

**Si ça casse** : `make check-setup` dit ce qui manque (Docker, Node, `.env`).
