# Scénario : le client web

**Prouve** : V.1, *"make your service web "responsive" so it can adapt to any screen size"*.

**Prérequis** :

- Chrome sur un ordinateur et le téléphone Android, tous deux sur le backend de la machine de référence (`make dev-web`, client web sur http://localhost:8081) ;
- comptes du seed ([demo-accounts.md](../../development/demo-accounts.md)) : Bob (`bob@zumik.dev`) dans le navigateur, Patrick (`patrick@zumik.dev`) sur le téléphone. Ils sont amis, et « Jellyfishing Jams » appartient à Bob avec Patrick comme collaborateur.

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 1 | **Même playlist en temps réel** : Bob ouvre « Jellyfishing Jams » dans le navigateur, Patrick l'ouvre sur le téléphone. Patrick ajoute un titre | Le titre apparaît dans le navigateur sans recharger | ☐ |
| 2 | Bob déplace un titre à la souris | Le téléphone affiche le nouvel ordre | ☐ |
| 3 | **Redimensionner** : fenêtre large (≥ 1024 px) sur **Accueil** | Barre latérale, contenu centré, grille de playlists | ☐ |
| 4 | Réduire vers 900 px, puis sous 768 px | D'abord un rail d'icônes, puis la barre d'onglets en bas et la mise en page téléphone, sans recharger | ☐ |
| 5 | Ouvrir le lecteur, en large puis en étroit | Panneau à droite sur bureau, plein écran sur fenêtre étroite | ☐ |
| 6 | **Licences** : Patrick, sur le téléphone, **Profil › Mes appareils**, active Bob sous son téléphone. Bob, dans le navigateur, active Patrick sous « Chrome sur … » (l'appareil navigateur) | Licences accordées dans les deux sens | ☐ |
| 7 | **Navigateur → téléphone** : Bob lance un titre, ouvre le choix d'appareil depuis le lecteur et choisit le téléphone de Patrick dans **Appareils de mes amis** | Le téléphone reprend le titre à la même position. Le navigateur se met en pause et devient télécommande : pause et lecture depuis le navigateur pilotent le téléphone | ☐ |
| 8 | **Téléphone → navigateur** : Patrick choisit le navigateur de Bob | Si personne n'a cliqué dans l'onglet depuis son chargement, le navigateur affiche « Cliquer pour activer le son ». Après **Activer le son**, la lecture démarre et le téléphone la voit | ☐ |
| 9 | Pause depuis le téléphone ; montrer les touches média du clavier ou la notification média du navigateur | Le navigateur se met en pause | ☐ |
| 10 | **Google sur le web** : **Profil › Se déconnecter**, puis le bouton Google de l'écran de connexion | Même compte qu'avec Google sur le téléphone. L'origine doit être déclarée dans la console Google ([accounts-auth.md](../../features/accounts-auth.md#console-setup-by-hand-once-per-origin)) | ☐ |
