# Scénario : visibilité et licence d'édition

**Prouve** : IV.2.3, *"By default, a playlist is public"*, *"If it is private, only the invited users can have access"*, *"By default, everyone can edit"*, *"With the right license, the invited users are the only ones who can edit"*.

**Prérequis** : Bob sur A, Mme Puff (aucun lien avec Bob) sur B.

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 1 | Bob : **Créer une playlist** « Démo droits », ajouter un titre, puis ⋯ › **Visibilité et droits** | « Publique : visible par tous », « Ouvert : tout le monde peut modifier » | ☐ |
| 2 | Mme Puff : trouver « Démo droits » dans les playlists publiques, l'ouvrir et ajouter un titre | Accès et ajout autorisés : public et ouvert par défaut | ☐ |
| 3 | Bob : passer la modification en **Restreint** | Chez Mme Puff, l'ajout et le déplacement disparaissent ; la playlist reste visible | ☐ |
| 4 | Bob : ajouter Patrick comme éditeur | Patrick peut modifier, Mme Puff toujours pas | ☐ |
| 5 | Bob : passer la playlist en **Privée** pendant que Mme Puff l'a ouverte | Mme Puff est sortie de la playlist en direct et ne la trouve plus | ☐ |
| 6 | Bob : inviter Mme Puff (« Personnes ayant accès ») | Elle retrouve la playlist, en lecture seule si elle n'est pas éditrice | ☐ |

**Avec le seed, sans rien créer** : Patrick ne voit pas « Solos de clarinette », une playlist privée de Carlo où Bob n'est que lecteur. Bob la voit mais ne peut pas la modifier.

**À dire** : les règles tiennent dans deux fonctions, `canViewPlaylist` et `canEditPlaylist`, appelées par chaque route HTTP et à l'entrée de la room Socket.io. L'app ne fait que cacher les boutons : un appel direct à l'API reçoit `403` (voir [06-security](../06-security/scenario-attacks.md)).
