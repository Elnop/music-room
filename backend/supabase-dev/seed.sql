-- =====================================================
-- Demo data for the local dev stack (make supabase-reset)
-- =====================================================
-- Loaded by scripts/dev-db.sh reset after the migrations, in one transaction.
-- Never applied to the hosted project. Accounts and what each one shows:
-- doc/development/demo-accounts.md (keep it in sync).

-- Users: auth.users + auth.identities, as GoTrue writes them for an email
-- sign-up with a confirmed address. GoTrue reads the token columns as strings,
-- so they hold '' rather than NULL, or sign-in fails.
CREATE TEMP TABLE demo_users (id uuid, username text, display_name text, bio text, genres text[]) ON COMMIT DROP;
INSERT INTO demo_users VALUES
  ('5b0b0000-0000-4000-8000-000000000001', 'bob', 'Bob l''éponge', 'Je suis prêt ! Cuisinier au Crabe Croustillant, chasseur de méduses.', '{pop,rock}'),
  ('5b0b0000-0000-4000-8000-000000000002', 'patrick', 'Patrick Étoile', 'Est-ce que la mayonnaise est un instrument ?', '{rock}'),
  ('5b0b0000-0000-4000-8000-000000000003', 'carlo', 'Carlo Tentacule', 'Clarinettiste incompris. Laissez-moi tranquille.', '{classical,jazz}'),
  ('5b0b0000-0000-4000-8000-000000000004', 'sandy', 'Sandy Écureuil', 'Scientifique et karatéka, tout droit venue du Texas.', '{country,metal}'),
  ('5b0b0000-0000-4000-8000-000000000005', 'krabs', 'M. Krabs', 'Patron du Crabe Croustillant. L''argent, l''argent, l''argent !', '{rnb}'),
  ('5b0b0000-0000-4000-8000-000000000006', 'plankton', 'Plankton', 'Un jour, la formule secrète sera à moi.', '{electronic}'),
  ('5b0b0000-0000-4000-8000-000000000007', 'karen', 'Karen', 'Ordinateur et épouse de Plankton.', '{electronic,hiphop}'),
  ('5b0b0000-0000-4000-8000-000000000008', 'gary', 'Gary', 'Miaou.', '{}'),
  ('5b0b0000-0000-4000-8000-000000000009', 'mrspuff', 'Mme Puff', 'Monitrice d''auto-école. Pas de questions sur les accidents.', '{latin,pop,rock}'),
  ('5b0b0000-0000-4000-8000-000000000010', 'pearl', 'Perle', 'Fille de M. Krabs et fan de boys bands.', '{pop,hiphop,rnb}');

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
SELECT
  '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated',
  username || '@zumik.dev', extensions.crypt('Password123!', extensions.gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}', '{}', now(), now(),
  '', '', '', ''
FROM demo_users;

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
SELECT
  gen_random_uuid(), id, id::text, 'email',
  jsonb_build_object('sub', id::text, 'email', username || '@zumik.dev', 'email_verified', true),
  now(), now(), now()
FROM demo_users;

INSERT INTO public.user_profiles (id, username, display_name, bio, email_verified, has_password)
SELECT id, username, display_name, bio, true, true FROM demo_users;

-- The profile insert creates music_preferences and profile_privacy rows with
-- the defaults (trigger from 011); fill them in.
UPDATE public.music_preferences m SET genres = d.genres
FROM demo_users d WHERE m.user_id = d.id;

-- Privacy: defaults for everyone, except Carlo (friends only) and Plankton
-- (everything private), to show the restricted profile views.
UPDATE public.profile_privacy p SET
  bio_visibility = CASE d.username WHEN 'carlo' THEN 'friends_only' WHEN 'plankton' THEN 'private' ELSE 'public' END::visibility_level,
  avatar_visibility = CASE d.username WHEN 'plankton' THEN 'private' ELSE 'public' END::visibility_level,
  music_preferences_visibility = CASE d.username WHEN 'carlo' THEN 'friends_only' WHEN 'plankton' THEN 'private' ELSE 'public' END::visibility_level
FROM demo_users d WHERE p.user_id = d.id;

-- Follows: a friend is a mutual follow.
--   friends: bob-patrick, bob-sandy, krabs-pearl, plankton-karen
--   one way: bob -> krabs, bob -> carlo, patrick -> carlo, gary -> bob
INSERT INTO public.follows (follower_id, following_id)
SELECT f.id, t.id
FROM (VALUES
  ('bob', 'patrick'), ('patrick', 'bob'),
  ('bob', 'sandy'), ('sandy', 'bob'),
  ('krabs', 'pearl'), ('pearl', 'krabs'),
  ('plankton', 'karen'), ('karen', 'plankton'),
  ('bob', 'krabs'), ('bob', 'carlo'), ('patrick', 'carlo'), ('gary', 'bob')
) AS edge(follower, following)
JOIN demo_users f ON f.username = edge.follower
JOIN demo_users t ON t.username = edge.following;

-- Tracks: public SoundCloud tracks, full length (no 30 s previews), checked to
-- stream when this file was written. track_uri is the permalink; stream URLs
-- are fetched on demand, never stored. A track deleted on SoundCloud stays
-- listed but no longer plays: replace it here.
CREATE TEMP TABLE demo_tracks (key text, track_uri text, title text, artist text, album_art text, duration_ms int) ON COMMIT DROP;
INSERT INTO demo_tracks VALUES
  ('theme', 'https://soundcloud.com/the-clown-table/spongebob-squarepants-theme-song-new-hd-episode-opening-credits-nick-animation', 'SpongeBob SquarePants Theme Song', 'Cartoon Tunes', 'https://i1.sndcdn.com/artworks-000254518352-aowqqw-large.jpg', 66110),
  ('sweet_victory', 'https://soundcloud.com/kyla-mooney-626583314/sweet-victory-spongebob-squarepants', 'Sweet Victory- SpongeBob SquarePants', 'MoistWaterMelon', 'https://i1.sndcdn.com/artworks-000490070823-c49qi4-large.jpg', 228755),
  ('goofy_goober', 'https://soundcloud.com/matthew93256/goofy-goober-rock', 'Goofy Goober Rock', 'Matthew93256', 'https://i1.sndcdn.com/artworks-000061171800-t8fvrx-large.jpg', 230289),
  ('ripped_pants', 'https://soundcloud.com/totallykk/ripped-pants-spongebob-1', 'Ripped Pants - Spongebob', 'Totally Kyle', 'https://i1.sndcdn.com/artworks-000137706727-dv4rqe-large.jpg', 82488),
  ('campfire', 'https://soundcloud.com/app-321/spongebob-the-campfire-song', 'Spongebob the campfire song song', 'app-321', 'https://i1.sndcdn.com/avatars-000096722638-tagk0y-large.jpg', 65146),
  ('best_day', 'https://soundcloud.com/zack-benson-105569060/the-best-day-ever', 'The Best Day Ever', 'SpongeBob', 'https://i1.sndcdn.com/artworks-1RU4jizUOvhUTkt0-rz0GTg-large.jpg', 182250),
  ('clarinet', 'https://soundcloud.com/user-614401149/squidward-all-star-on-clarinet', 'Squidward All Star On Clarinet', 'Interdes', 'https://i1.sndcdn.com/artworks-000226904378-vidwum-large.jpg', 103088),
  ('plankton_rap', 'https://soundcloud.com/dogboy25tn/spongebob-vs-plankton-epic-rap', 'SpongeBob Vs Plankton REMIX Epic Rap Battles of Cringe', '05StarSieGuy669', 'https://i1.sndcdn.com/artworks-ybbdMMRS5HGq6tAr-t39dCA-large.jpg', 79935),
  ('pizza', 'https://soundcloud.com/djlucidlou/krusty-krab-pizza', 'Krusty Krab Pizza', 'lucidlou', 'https://i1.sndcdn.com/artworks-XGx3U9bBDNI87wYI-f6dfwA-large.jpg', 189231);

INSERT INTO public.tracks (track_uri, title, artist, album_art, duration_ms)
SELECT track_uri, title, artist, album_art, duration_ms FROM demo_tracks;

-- Playlists, one per sharing case: public and open, public with a
-- collaborator, private with a viewer, private with a collaborator.
CREATE TEMP TABLE demo_playlists (id uuid, owner text, name text, description text, visibility text, edit_mode text, collaborators text[], viewers text[]) ON COMMIT DROP;
INSERT INTO demo_playlists VALUES
  ('5b0b0000-0000-4000-8000-000000000101', 'krabs', 'Les tubes du Crabe Croustillant', 'Ce qui passe en cuisine. Tout le monde peut ajouter un morceau, tant que c''est gratuit.', 'public', 'open', '{}', '{}'),
  ('5b0b0000-0000-4000-8000-000000000102', 'bob', 'Jellyfishing Jams', 'Pour chasser la méduse avec Patrick.', 'public', 'restricted', '{patrick}', '{}'),
  ('5b0b0000-0000-4000-8000-000000000103', 'carlo', 'Solos de clarinette', 'Du grand art. Bob a le droit d''écouter, en silence.', 'private', 'restricted', '{}', '{bob}'),
  ('5b0b0000-0000-4000-8000-000000000104', 'plankton', 'Plan secret', 'Musique d''ambiance pour voler la formule.', 'private', 'restricted', '{karen}', '{}');

INSERT INTO public.playlists (id, owner_id, name, description, visibility, edit_mode, collaborator_ids, viewer_ids)
SELECT p.id, o.id, p.name, p.description, p.visibility, p.edit_mode,
  ARRAY(SELECT u.id FROM demo_users u WHERE u.username = ANY (p.collaborators)),
  ARRAY(SELECT u.id FROM demo_users u WHERE u.username = ANY (p.viewers))
FROM demo_playlists p
JOIN demo_users o ON o.username = p.owner;

-- Tracks go in through playlist_add_track (016), in list order, so ranks and
-- versions are the ones the app writes.
DO $$
DECLARE
  entry record;
BEGIN
  FOR entry IN
    SELECT p.id AS playlist_id, t.id AS track_id, u.id AS added_by
    FROM (VALUES
      (1, 'Les tubes du Crabe Croustillant', 'pizza', 'krabs'),
      (2, 'Les tubes du Crabe Croustillant', 'theme', 'krabs'),
      (3, 'Les tubes du Crabe Croustillant', 'best_day', 'pearl'),
      (4, 'Jellyfishing Jams', 'goofy_goober', 'bob'),
      (5, 'Jellyfishing Jams', 'ripped_pants', 'bob'),
      (6, 'Jellyfishing Jams', 'campfire', 'patrick'),
      (7, 'Jellyfishing Jams', 'sweet_victory', 'bob'),
      (8, 'Solos de clarinette', 'clarinet', 'carlo'),
      (9, 'Plan secret', 'plankton_rap', 'karen')
    ) AS item(n, playlist, track, adder)
    JOIN demo_playlists dp ON dp.name = item.playlist
    JOIN public.playlists p ON p.id = dp.id
    JOIN demo_tracks dt ON dt.key = item.track
    JOIN public.tracks t ON t.track_uri = dt.track_uri
    JOIN demo_users u ON u.username = item.adder
    ORDER BY item.n
  LOOP
    PERFORM public.playlist_add_track(entry.playlist_id, entry.track_id, entry.added_by);
  END LOOP;
END;
$$;
