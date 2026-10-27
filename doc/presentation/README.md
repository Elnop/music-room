# Présentation et recette

Supports de soutenance de Zumik, une partie du sujet v5.3 par dossier ([en.subject.pdf](../subject/en.subject.pdf), qui prime sur tout le reste). Chaque dossier contient :

- `exigences.md` : ce que demande le sujet, cité mot pour mot, ce qu'on livre, où le vérifier et les écarts assumés ;
- `scenario-*.md` : une démo pas à pas qui sert aussi de recette. Chaque étape donne l'action, le résultat attendu et une case à cocher.

Pour le détail technique, voir [subject/coverage.md](../subject/coverage.md), qui relie chaque exigence au code, et les pages de `doc/features/`.

## Déroulé de la soutenance

Tout se fait sur la **machine de référence**, celle des mesures IV.7 : backend, stack Supabase locale avec les comptes de démo, Redis et client web. La prod (backend hébergé, GitHub Pages) n'est pas utilisée.

On présente d'abord la partie obligatoire. Le sujet le rappelle : *"The bonus part will only be assessed if the mandatory part is PERFECT."*

| # | Partie | Sujet | Dossier |
| --- | --- | --- | --- |
| 0 | Préparation (avant l'arrivée du correcteur) | — | [00-setup](00-setup/) |
| 1 | Architecture, choix techniques, app mobile | III.1, III.2 | [01-architecture](01-architecture/) |
| 2 | Utilisateur : comptes, réseaux sociaux, profil | IV.1 | [02-user](02-user/) |
| 3 | Music Playlist Editor | IV.2.3 | [03-playlist-editor](03-playlist-editor/) |
| 4 | Music Control Delegation | IV.2.2 | [04-control-delegation](04-control-delegation/) |
| 5 | Serveur, API, application « télécommande » | IV.3, IV.4, IV.5 | [05-server-api](05-server-api/) |
| 6 | Sécurité et logs | IV.6 | [06-security](06-security/) |
| 7 | Montée en charge | IV.7 | [07-scaling](07-scaling/) |
| 8 | Agilité, qualité, intégration continue | IV.8 | [08-quality-ci](08-quality-ci/) |
| 9 | Bonus : client web responsive | V.1 | [09-bonus-web](09-bonus-web/) |
| 10 | Bonus : IoT, iBeacon | V.2 | [10-bonus-iot](10-bonus-iot/) |
| 11 | Bonus : abonnement gratuit et payant | V.3 | [11-bonus-subscription](11-bonus-subscription/) |

Le sujet demande deux services sur trois (*"user must access at least 2 functions out of the following 3 ones"*). Zumik livre **Music Playlist Editor** et **Music Control Delegation**. **Music Track Vote** (IV.2.1) n'est pas implémenté, c'est voulu ; le bonus V.4 (mode hors ligne) non plus.

## Recette

Avant la correction, dérouler [00-setup/recette.md](00-setup/recette.md), qui renvoie vers chaque scénario. Un scénario dont une case reste vide est un ticket à ouvrir avant la soutenance.
