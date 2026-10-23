# Comptes de démo

`make supabase-reset` vide la base de la stack Supabase locale (`SUPABASE_MODE=local`, voir `backend/README.md`), réapplique les migrations puis charge les données de démo de `backend/supabase-dev/seed.sql`. `make supabase-up` ne les charge pas : il ne touche jamais aux données déjà là. Rien de tout ça n'atteint le projet Supabase hébergé.

Le fichier SQL est la référence ; ce document doit le suivre quand on le modifie.

## Comptes

Tous les comptes ont le mot de passe `Password123!` et un email déjà vérifié : la connexion par email marche tout de suite, sans code.

| Email | Nom affiché | Ce qu'il montre |
|---|---|---|
| `bob@zumik.dev` | Bob l'éponge | Le compte le plus complet : deux amis, deux suivis à sens unique, une playlist partagée avec Patrick, viewer de la playlist privée de Carlo |
| `patrick@zumik.dev` | Patrick Étoile | Ami de Bob, collaborateur de « Jellyfishing Jams », n'a pas accès à « Solos de clarinette » |
| `carlo@zumik.dev` | Carlo Tentacule | Bio et goûts musicaux visibles par ses amis seulement ; il n'a aucun ami, donc personne ne les voit |
| `sandy@zumik.dev` | Sandy Écureuil | Amie de Bob |
| `krabs@zumik.dev` | M. Krabs | Playlist publique ouverte à tous, ami de Perle |
| `plankton@zumik.dev` | Plankton | Profil entièrement privé, playlist privée partagée avec Karen |
| `karen@zumik.dev` | Karen | Amie et collaboratrice de Plankton |
| `gary@zumik.dev` | Gary | Suit Bob sans être suivi en retour, aucun genre musical |
| `mrspuff@zumik.dev` | Mme Puff | Compte isolé : ni ami, ni playlist |
| `pearl@zumik.dev` | Perle | Amie de M. Krabs, a ajouté un morceau à sa playlist |

## Amis et suivis

Un ami est un suivi mutuel.

- Amis : Bob et Patrick, Bob et Sandy, M. Krabs et Perle, Plankton et Karen.
- Suivis à sens unique : Bob suit M. Krabs et Carlo, Patrick suit Carlo, Gary suit Bob.

## Playlists

| Playlist | Propriétaire | Visibilité | Édition | Partagée avec | Morceaux |
|---|---|---|---|---|---|
| Les tubes du Crabe Croustillant | M. Krabs | publique | ouverte (`open`) | — | 3 |
| Jellyfishing Jams | Bob | publique | restreinte | Patrick (collaborateur) | 4 |
| Solos de clarinette | Carlo | privée | restreinte | Bob (viewer) | 1 |
| Plan secret | Plankton | privée | restreinte | Karen (collaboratrice) | 1 |

Les morceaux sont de vrais morceaux SoundCloud publics, complets (pas d'extraits de 30 s). Chacun lisait correctement quand on les a ajoutés. Si un morceau disparaît de SoundCloud, il reste dans la playlist mais ne se lit plus : remplacez son permalien dans `seed.sql`.

## Identifiants fixes

Les UUID ne changent pas d'un reset à l'autre, ce qui permet de les retrouver dans Swagger UI ou dans Studio :

- utilisateurs : `5b0b0000-0000-4000-8000-0000000000NN`, de `01` (Bob) à `10` (Perle), dans l'ordre du tableau des comptes ;
- playlists : `5b0b0000-0000-4000-8000-00000000010N`, de `1` (Crabe Croustillant) à `4` (Plan secret).
