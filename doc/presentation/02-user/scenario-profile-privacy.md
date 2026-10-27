# Scénario : profil public, amis, privé et préférences musicales

**Prouve** : IV.1, *"their public informations, informations only available to their friends, their private informations, their music preferences"*.

**Prérequis** : Bob sur A, Patrick (ami de Bob) sur B, et Mme Puff (aucun ami) disponible sur B.

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 1 | Bob : **Profil**, modifier le nom affiché et la bio, ajouter une photo, **Enregistrer** | Le profil est mis à jour | ☐ |
| 2 | Bob : **Préférences musicales**, choisir des genres | Les genres s'affichent sur le profil (5 au maximum) | ☐ |
| 3 | Bob : **Profil › Confidentialité** : Photo **Public**, Bio **Amis seulement**, Adresse email **Privé**, Préférences musicales **Amis seulement** | Réglages enregistrés | ☐ |
| 4 | Patrick (ami) : **Amis**, ouvrir le profil de Bob | Photo, bio et préférences visibles ; email caché | ☐ |
| 5 | Se connecter en Mme Puff sur B, chercher Bob et ouvrir son profil | Seule la photo est visible ; la bio affiche « Visible uniquement par ses amis » et les préférences « Visibles uniquement par ses amis » | ☐ |
| 6 | Mme Puff : **Suivre** Bob | Mme Puff ne voit toujours pas la bio : un ami, c'est un abonnement **mutuel** | ☐ |
| 7 | Bob : remettre la bio en **Public** | Mme Puff la voit après rafraîchissement | ☐ |

**Variante sans rien régler** : avec le seed, Carlo a sa bio et ses goûts en **Amis seulement** mais aucun ami. Bob, qui le suit sans être suivi en retour, ne voit pas ces champs.

**Lien avec les suggestions** : passer ses préférences musicales en **Amis seulement** ou **Privé** retire aussi le profil des « Profils aux goûts proches » des autres ([scenario-similar-tastes.md](../03-playlist-editor/scenario-similar-tastes.md)).

**À dire** : le filtrage se fait **côté serveur** (`getFilteredProfile`). Un champ privé ne quitte jamais le backend, même pour un client modifié.
