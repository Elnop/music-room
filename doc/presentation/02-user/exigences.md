# IV.1 Utilisateur

## Ce que dit le sujet

> *"When the user runs the application for the first time, they must create an account on the application. They will choose between a mail/password or a social network account (Facebook or Google) registration."*

> *"Once the user has an account on your platform, the application must allow them to link their network account (Facebook or Google)."*

> *"In their profile, the user must be able to state and update: their public informations, informations only available to their friends, their private informations, their music preferences."*

> *"If the user has created an account with a mail/password, the application must demand a mail validation and invites the user to change their password if they forgot it."*

## Ce qu'on livre

- **Inscription** par email et mot de passe, ou avec Google ou Facebook. Le backend vérifie lui-même le jeton du fournisseur ; il n'utilise pas le flux OAuth de Supabase.
- **Validation de l'email par un code à 6 chiffres** : la connexion est refusée tant que l'email n'est pas validé. **Mot de passe oublié** : un code reçu par email, puis un nouveau mot de passe ; toutes les sessions ouvertes sont fermées.
- **Comptes liés** : on lie Google ou Facebook à un compte existant, même si son email est différent, et on peut les délier. Délier la dernière méthode de connexion est refusé.
- **Profil** : chaque champ (photo, email, bio, préférences musicales) se règle sur **Public**, **Amis seulement** ou **Privé**. Le serveur filtre le profil selon la relation entre celui qui lit et le propriétaire. On choisit jusqu'à 5 genres en préférences musicales.
- **Amis** = abonnement mutuel.

## Où regarder

- Backend : `backend/src/features/auth/`, `backend/src/features/profile/` (`getFilteredProfile`)
- Mobile : `mobile/src/features/auth/`, `mobile/src/features/profile/`
- Détail : [accounts-auth.md](../../features/accounts-auth.md), menaces M1 à M6 de [threat-model.md](../../security/threat-model.md)

## Scénarios

- [scenario-signup-email.md](scenario-signup-email.md) : inscription par email, validation, mot de passe oublié
- [scenario-social-login.md](scenario-social-login.md) : Google, Facebook, comptes liés
- [scenario-profile-privacy.md](scenario-profile-privacy.md) : profil public, amis, privé et préférences

## Écarts assumés

- **Facebook en mode développement** : tant que l'app Meta n'est pas publiée, seuls ses administrateurs, développeurs et testeurs peuvent se connecter. Le compte du correcteur doit y être ajouté, ou la démo se fait avec un compte testeur.
