# Scénario : changer l'adresse du backend dans l'app

**Prouve** : IV.5, *"the back-end's address must be configurable on the application for tests"* et *"Applications must only be "remote control" to the back-end"*.

**Prérequis** : téléphone A connecté au backend local. Une seconde adresse de la machine de référence : son IP sur le réseau local (ex. `http://192.168.1.20:3000`) si le téléphone passe par `localhost` en USB, ou l'inverse. Pas l'adresse de la prod : tout reste sur la machine de référence.

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 1 | **Profil › Paramètres › Serveur** | L'adresse courante s'affiche | ☐ |
| 2 | Saisir une adresse invalide (`pas-une-url`) | Refusée, avec un message | ☐ |
| 3 | Saisir l'autre adresse et valider | Les requêtes suivantes et le socket partent vers la nouvelle adresse, **sans rebuild** | ☐ |
| 4 | Regarder `make logs-backend` sur l'ancien backend | Plus aucune requête de ce téléphone n'y arrive | ☐ |
| 5 | Se déconnecter : l'écran d'accueil propose aussi le champ **Serveur** | L'adresse se règle avant même la connexion | ☐ |
| 6 | Couper le backend (`docker stop` du conteneur backend) et rafraîchir une playlist | L'app affiche une erreur et rien d'autre : sans backend, pas de données | ☐ |
| 7 | Remettre l'adresse locale | Retour à la normale | ☐ |

**À dire** : l'adresse est enregistrée sur le téléphone, validée, et relue par chaque module au moment de l'appel. La valeur par défaut est `EXPO_PUBLIC_API_URL`, fixée au build.
