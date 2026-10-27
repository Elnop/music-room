# Scénario : Google, Facebook et comptes liés

**Prouve** : IV.1 (*"a social network account (Facebook or Google) registration"*, *"the application must allow them to link their network account"*) et IV.5 (*"Authentication support through a social network like Facebook or Google must be implemented in the mobile application"*).

**Prérequis** : téléphone A, un compte Google présent sur le téléphone, un compte Facebook testeur de l'app Meta, et Bob connecté pour la 2ᵉ partie.

## Inscription par réseau social

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 1 | Déconnecté : **Continuer avec Google**, choisir le compte | Compte créé (ou retrouvé) et connecté sans mot de passe | ☐ |
| 2 | **Profil › Se déconnecter**, puis **Continuer avec Facebook** | Connexion Facebook réussie | ☐ |

## Lier un compte existant

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 3 | Se connecter en Bob (email et mot de passe), **Profil › Comptes liés** | Email et mot de passe actif, Google et Facebook non liés | ☐ |
| 4 | Lier Google, avec un compte Google dont l'email n'est pas celui de Bob | Google apparaît lié | ☐ |
| 5 | Se déconnecter, puis **Continuer avec Google** avec ce compte | On retrouve le compte de Bob (mêmes playlists et mêmes amis) | ☐ |
| 6 | **Comptes liés** : délier Google | Google redevient non lié | ☐ |
| 7 | Avec un compte créé par Google seul (étape 1), essayer de délier Google | Refusé : c'est la dernière méthode de connexion | ☐ |

**À dire** : le backend vérifie le jeton Google ou Facebook lui-même (`oauth.service.ts`) avant de créer ou de lier le compte. Un identifiant Google déjà lié à un autre compte est refusé.

**Si ça casse** : Facebook refuse le compte ? Il doit être ajouté comme testeur de l'app Meta ([accounts-auth.md](../../features/accounts-auth.md#console-setup-by-hand-once-per-origin)).
