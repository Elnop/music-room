# Demo accounts

`make supabase-reset` empties the database of the local Supabase stack (`SUPABASE_MODE=local`, see `backend/README.md`), reapplies the migrations, then loads the demo data from `backend/supabase-dev/seed.sql`. `make supabase-up` does not load them: it never touches data already there. None of this reaches the hosted Supabase project.

The SQL file is the reference; update this document whenever you change it.

Display names and playlist names below are quoted exactly as they appear in the seed.

## Accounts

Every account has the password `Password123!` and an already verified email: email sign-in works right away, without a code.

| Email | Display name | What it shows |
|---|---|---|
| `bob@zumik.dev` | Bob l'éponge | The most complete account: two friends, two one-way follows, a playlist shared with Patrick, viewer of Carlo's private playlist |
| `patrick@zumik.dev` | Patrick Étoile | Bob's friend, collaborator on "Jellyfishing Jams", no access to "Solos de clarinette" |
| `carlo@zumik.dev` | Carlo Tentacule | Bio and music tastes visible to friends only; he has no friends, so nobody sees them |
| `sandy@zumik.dev` | Sandy Écureuil | Bob's friend |
| `krabs@zumik.dev` | M. Krabs | Public playlist open to everyone, Pearl's friend |
| `plankton@zumik.dev` | Plankton | Fully private profile, private playlist shared with Karen |
| `karen@zumik.dev` | Karen | Plankton's friend and collaborator |
| `gary@zumik.dev` | Gary | Follows Bob without being followed back, no music genre |
| `mrspuff@zumik.dev` | Mme Puff | Isolated account: no friend, no playlist; shares pop and rock with Bob, so she heads his « Profils aux goûts proches » |
| `pearl@zumik.dev` | Perle | M. Krabs's friend, added a track to his playlist |

## Friends and follows

A friend is a mutual follow.

- Friends: Bob and Patrick, Bob and Sandy, M. Krabs and Pearl, Plankton and Karen.
- One-way follows: Bob follows M. Krabs and Carlo, Patrick follows Carlo, Gary follows Bob.

## Playlists

| Playlist | Owner | Visibility | Editing | Shared with | Tracks |
|---|---|---|---|---|---|
| Les tubes du Crabe Croustillant | M. Krabs | public | open (`open`) | — | 3 |
| Jellyfishing Jams | Bob | public | restricted | Patrick (collaborator) | 4 |
| Solos de clarinette | Carlo | private | restricted | Bob (viewer) | 1 |
| Plan secret | Plankton | private | restricted | Karen (collaborator) | 1 |

The tracks are real, public, full-length SoundCloud tracks (not 30-second previews). Each one played correctly when it was added. If a track disappears from SoundCloud, it stays in the playlist but no longer plays: replace its permalink in `seed.sql`.

## Fixed identifiers

UUIDs do not change from one reset to the next, so they are easy to find in Swagger UI or Studio:

- users: `5b0b0000-0000-4000-8000-0000000000NN`, from `01` (Bob) to `10` (Pearl), in the order of the accounts table;
- playlists: `5b0b0000-0000-4000-8000-00000000010N`, from `1` (Crabe Croustillant) to `4` (Plan secret).
