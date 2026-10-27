# Scénario : passer en Premium et revenir

**Prouve** : V.3, *"allow users to switch between two offers"* et *"Some of your application's functionalities [...] will only be available to users with a paid subscription"*.

**Prérequis** : sur un téléphone, un compte en gratuit qui possède une playlist (Bob et « Jellyfishing Jams »). En option, un second téléphone qui a la playlist ouverte.

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 1 | Compte gratuit : ouvrir la playlist, ⋯ › **Changer la cover** | Un cadenas et « Réservé au Premium ». En appuyant, un message explique le Premium et propose **Paramètres**. Aucune requête d'envoi ne part | ☐ |
| 2 | **Paramètres**, activer **Premium** | L'offre change aussitôt, sans redémarrage. « Simulation : aucun paiement n'est demandé. » | ☐ |
| 3 | Revenir sur la playlist : ⋯ › **Changer la cover**, choisir une image | La cover change, et en direct sur le second téléphone | ☐ |
| 4 | **Paramètres**, désactiver **Premium** | Retour en gratuit | ☐ |
| 5 | Revenir sur la playlist | La cover est toujours là. **Changer la cover** est de nouveau verrouillé (le serveur répondrait `403 PREMIUM_REQUIRED`). **Retirer la cover** marche toujours et remet la pochette du premier titre | ☐ |
