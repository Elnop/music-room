# Scénario : file d'attente partagée et transfert de lecture

**Prouve** : IV.2.2, *"give the music control to different friends"* : au-delà de lecture et pause, un ami délégué pilote toute l'écoute.

**Prérequis** : Patrick a une licence sur le téléphone A de Bob ([scenario-delegation.md](scenario-delegation.md), étape 2). A est en ligne.

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 1 | Bob sur A : lancer « Jellyfishing Jams » (bouton Play) | La file d'attente de Bob contient la playlist | ☐ |
| 2 | Patrick, qui contrôle A : ouvrir la **File d'attente** depuis le lecteur | Il voit la file de Bob, titre en cours et **À suivre** | ☐ |
| 3 | Patrick : réordonner la file et passer au titre suivant | A enchaîne ; la file de Bob est à jour sur A | ☐ |
| 4 | Patrick : sur un titre (glisser à droite), **Ajouter à la file d'attente** | Le titre arrive dans la file de Bob | ☐ |
| 5 | Bob sur A : choix d'appareil, **Appareils de mes amis** › le téléphone de Patrick (Patrick doit avoir donné une licence à Bob) | La lecture passe sur B à la même position ; A se met en pause et devient télécommande | ☐ |
| 6 | Bob : pause depuis A | B se met en pause | ☐ |
| 7 | Patrick : retirer la licence de Bob | Bob perd la main sur B à l'instant | ☐ |

**À dire** :

- La file a une version : un état plus ancien que celui affiché est ignoré, donc une réponse tardive ne fait pas revenir en arrière.
- Un transfert fait toutes ses vérifications (licence, appareil en ligne) **avant** de modifier quoi que ce soit. Sinon il répond `403` ou `409 DEVICE_OFFLINE`, sans aucun changement.
