# Scénario : inscription par email, validation, mot de passe oublié

**Prouve** : IV.1, *"they must create an account"*, *"the application must demand a mail validation and invites the user to change their password if they forgot it"*.

**Prérequis** : stack locale (les emails arrivent dans Mailpit, http://localhost:54424), app déconnectée sur le téléphone A.

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 1 | Premier lancement de l'app (ou après déconnexion) | L'écran d'accueil propose de se connecter ou de créer un compte : rien n'est accessible sans compte | ☐ |
| 2 | **Créer un compte**, choisir l'email et mot de passe, saisir un email neuf (ex. `correcteur@zumik.dev`) et un mot de passe | L'écran « Vérifiez votre email » demande un code | ☐ |
| 3 | Revenir en arrière et tenter **Se connecter** avec ce compte | Refus : email non vérifié | ☐ |
| 4 | Ouvrir Mailpit | Un email avec un code à 6 chiffres | ☐ |
| 5 | Saisir le code, **Vérifier** | Connecté, arrivée sur **Accueil** | ☐ |
| 6 | **Profil › Se déconnecter**, puis **Mot de passe oublié ?**, saisir l'email, **Envoyer le code** | Un nouvel email arrive dans Mailpit | ☐ |
| 7 | Saisir le code et un nouveau mot de passe, **Réinitialiser le mot de passe** | Confirmation du changement | ☐ |
| 8 | Se connecter avec l'ancien mot de passe | Refusé | ☐ |
| 9 | Se connecter avec le nouveau | Connecté | ☐ |

**À dire** : *Mot de passe oublié* répond la même chose que l'email existe ou non (pas d'énumération des comptes). Les codes ont un nombre d'essais limité. Une réinitialisation ferme toutes les sessions ouvertes du compte (M2 et M3 de [threat-model.md](../../security/threat-model.md)).

**Si ça casse** : pas d'email ? Vérifier `make logs-supabase` et que `SUPABASE_MODE=local`.
