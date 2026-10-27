# V.3 Abonnement gratuit et payant

## Ce que dit le sujet

> *"This bonus will allow you to implement this kind of logic in your application. You will then have to allow users to switch between two offers you will have established beforehand. Some of your application's functionalities (Music Playlist Editor for instance) will only be available to users with a paid subscription."*

## Ce qu'on livre

- **Deux offres**, `free` et `premium`, stockées dans `user_profiles.plan`. Un nouveau compte démarre en gratuit.
- **Le gratuit couvre toute la partie obligatoire.** Le Premium débloque une cover personnalisée pour ses playlists.
- **Changement d'offre simulé, sans paiement** : **Profil › Paramètres › Abonnement**. Il prend effet immédiatement, sans redémarrage. Un vrai prestataire de paiement pourrait remplacer l'endpoint sans toucher aux vérifications d'accès.
- **Vérification côté serveur** : `assertPremium` répond `403 PREMIUM_REQUIRED`. L'app se contente de cacher ou verrouiller l'action.
- **Repasser en gratuit ne supprime rien** : la cover reste, mais on ne peut plus la changer.

## Où regarder

- [subscription.md](../../features/subscription.md)
- `backend/src/shared/subscription/plan.ts`, `backend/src/features/subscription/`, `mobile/src/shared/hooks/usePlan.ts`

## Scénario

- [scenario.md](scenario.md)

## Écarts assumés

- **La fonctionnalité réservée au Premium est la cover de playlist**, pas l'éditeur entier. Le sujet ne donne l'éditeur qu'en exemple (*"for instance"*), et le réserver au Premium aurait retiré une partie obligatoire aux comptes gratuits.
