# Scénario : édition à plusieurs en temps réel

**Prouve** : IV.2.3, *"Collaborate with your friends [...] to create playlists in real-time"*.

**Prérequis** : Bob sur A, Patrick sur B. « Jellyfishing Jams » appartient à Bob et Patrick en est collaborateur.

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 1 | A et B ouvrent « Jellyfishing Jams » | Mêmes titres, dans le même ordre | ☐ |
| 2 | B : **Ajouter des titres**, chercher sur SoundCloud, ajouter un titre | Le titre apparaît sur A sans recharger | ☐ |
| 3 | A : déplacer un titre par glisser-déposer | B affiche le nouvel ordre | ☐ |
| 4 | B : glisser un titre vers la gauche pour le retirer | Il disparaît sur A | ☐ |
| 5 | A et B déplacent **en même temps deux titres différents** | Les deux déplacements s'appliquent ; A et B affichent le même ordre | ☐ |
| 6 | A : lancer la lecture de la playlist (bouton Play), puis B ajoute un titre | Le titre s'ajoute aussi à la suite de la file d'attente de Bob | ☐ |

**Créer une playlist depuis zéro** (variante) : **Playlists › Créer une playlist**, sans toucher aux réglages. Elle est publique et ouverte par défaut, comme le demande le sujet.

**À dire** : chaque opération est une fonction Postgres qui verrouille la playlist ; le serveur les applique donc une par une, et les clients reçoivent le résultat avec sa version.
