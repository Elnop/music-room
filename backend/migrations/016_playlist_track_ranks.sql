-- =====================================================
-- 016: fractional ranks and versions for playlist tracks
-- Design: doc/PLAYLIST_CONCURRENCY.md
-- =====================================================

-- Rank keys are base-62 fractions in (0, 1), written with the digits below in
-- byte order (0-9 < A-Z < a-z), so COLLATE "C" sorts them numerically.
-- A key never ends with '0': then every key has exactly one spelling.

CREATE OR REPLACE FUNCTION public.rank_between(p_a text, p_b text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  digits CONSTANT text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  a text := coalesce(p_a, '');
  b text := p_b;
  prefix text := '';
  n int;
  da int;
  db int;
BEGIN
  IF b IS NOT NULL AND a COLLATE "C" >= b COLLATE "C" THEN
    RAISE EXCEPTION 'rank_between: % is not below %', a, b;
  END IF;

  LOOP
    IF b IS NOT NULL THEN
      -- Skip the common prefix, reading a missing digit of a as '0'.
      n := 0;
      WHILE n < length(b)
        AND coalesce(nullif(substr(a, n + 1, 1), ''), '0') = substr(b, n + 1, 1) LOOP
        n := n + 1;
      END LOOP;
      prefix := prefix || left(b, n);
      a := substr(a, n + 1);
      b := substr(b, n + 1);
    END IF;

    da := CASE WHEN a = '' THEN 0 ELSE strpos(digits, left(a, 1)) - 1 END;
    db := CASE WHEN b IS NULL THEN 62 ELSE strpos(digits, left(b, 1)) - 1 END;

    IF db - da > 1 THEN
      RETURN prefix || substr(digits, (da + db) / 2 + 1, 1);
    END IF;

    -- Consecutive digits: b's first digit alone fits when b has more digits.
    IF b IS NOT NULL AND length(b) > 1 THEN
      RETURN prefix || left(b, 1);
    END IF;

    -- Otherwise keep a's digit and look for room after it.
    prefix := prefix || substr(digits, da + 1, 1);
    a := substr(a, 2);
    b := NULL;
  END LOOP;
END;
$$;

-- Key after p_a for appends: increments the last digit, so keys grow by one
-- character every 61 appends instead of every few.
CREATE OR REPLACE FUNCTION public.rank_after(p_a text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  digits CONSTANT text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  last_digit int;
BEGIN
  IF p_a IS NULL OR p_a = '' THEN
    RETURN 'V';
  END IF;
  last_digit := strpos(digits, right(p_a, 1)) - 1;
  IF last_digit < 61 THEN
    RETURN left(p_a, length(p_a) - 1) || substr(digits, last_digit + 2, 1);
  END IF;
  RETURN p_a || '1';
END;
$$;

-- The p_index-th (1-based) of p_count evenly spaced keys, all of the same
-- width before trailing zeros are dropped.
CREATE OR REPLACE FUNCTION public.rank_spaced(p_index bigint, p_count bigint)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  digits CONSTANT text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  width int := 1;
  value numeric;
  key text := '';
BEGIN
  IF p_index < 1 OR p_index > p_count THEN
    RAISE EXCEPTION 'rank_spaced: index % out of 1..%', p_index, p_count;
  END IF;
  WHILE power(62::numeric, width) < p_count + 1 LOOP
    width := width + 1;
  END LOOP;
  value := floor(p_index * power(62::numeric, width) / (p_count + 1));
  FOR i IN 1..width LOOP
    key := substr(digits, (value % 62)::int + 1, 1) || key;
    value := floor(value / 62);
  END LOOP;
  RETURN rtrim(key, '0');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rank_between(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rank_after(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rank_spaced(bigint, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rank_between(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.rank_after(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.rank_spaced(bigint, bigint) TO service_role;

-- =====================================================
-- Schema: ranks replace positions, versions on playlists and rows
-- =====================================================

ALTER TABLE public.playlists
  ADD COLUMN tracks_version bigint NOT NULL DEFAULT 0,
  ADD COLUMN ranks_rebalanced_at_version bigint NOT NULL DEFAULT 0;

ALTER TABLE public.playlist_tracks
  ADD COLUMN rank text COLLATE "C",
  ADD COLUMN moved_at_version bigint NOT NULL DEFAULT 0;

-- Existing tracks keep their order, evenly spaced.
UPDATE public.playlist_tracks pt
SET rank = public.rank_spaced(r.idx, r.cnt)
FROM (
  SELECT id,
         row_number() OVER (PARTITION BY playlist_id ORDER BY position) AS idx,
         count(*) OVER (PARTITION BY playlist_id) AS cnt
  FROM public.playlist_tracks
) r
WHERE pt.id = r.id;

ALTER TABLE public.playlist_tracks
  ALTER COLUMN rank SET NOT NULL,
  ADD CONSTRAINT playlist_tracks_rank_format CHECK (rank ~ '^[0-9A-Za-z]*[1-9A-Za-z]$' AND length(rank) <= 128),
  ADD CONSTRAINT playlist_tracks_rank_unique UNIQUE (playlist_id, rank) DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE public.playlist_tracks DROP CONSTRAINT unique_playlist_position;
DROP INDEX IF EXISTS public.idx_playlist_tracks_playlist;
ALTER TABLE public.playlist_tracks DROP COLUMN position;

-- Track writes go only through the operation functions below, as service_role:
-- a direct insert or delete would skip the playlist lock and the version bump.
-- The select policy stays.
DROP POLICY IF EXISTS "playlist_tracks_insert_policy" ON public.playlist_tracks;
DROP POLICY IF EXISTS "playlist_tracks_delete_policy" ON public.playlist_tracks;

DROP FUNCTION IF EXISTS public.get_next_playlist_position(uuid);

COMMENT ON COLUMN public.playlist_tracks.rank IS 'Sort key: base-62 fraction, compared byte by byte (doc/PLAYLIST_CONCURRENCY.md)';
COMMENT ON COLUMN public.playlist_tracks.moved_at_version IS 'tracks_version at which this track was last added or moved';
COMMENT ON COLUMN public.playlists.tracks_version IS 'Incremented by every add, remove and move of a track';
COMMENT ON COLUMN public.playlists.ranks_rebalanced_at_version IS 'tracks_version of the last rebalance: older ranks are void';

-- =====================================================
-- Operations: one function per operation, serialized per playlist
-- =====================================================

-- Rebalance threshold: a generated rank longer than this respaces the playlist.
CREATE OR REPLACE FUNCTION public.rank_max_length()
RETURNS int LANGUAGE sql IMMUTABLE AS $$ SELECT 64 $$;

-- Locks the playlist row; every operation calls it first, so writers of one
-- playlist run one at a time and cannot deadlock.
CREATE OR REPLACE FUNCTION public.playlist_lock(p_playlist_id uuid)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  v bigint;
BEGIN
  SELECT tracks_version INTO v FROM public.playlists WHERE id = p_playlist_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PLAYLIST_NOT_FOUND';
  END IF;
  RETURN v;
END;
$$;

-- Respaces every rank of the playlist, keeping the order. Caller holds the lock
-- and has already set the new tracks_version.
CREATE OR REPLACE FUNCTION public.playlist_rebalance(p_playlist_id uuid, p_version bigint)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  SET CONSTRAINTS public.playlist_tracks_rank_unique DEFERRED;
  UPDATE public.playlist_tracks pt
  SET rank = public.rank_spaced(r.idx, r.cnt)
  FROM (
    SELECT id,
           row_number() OVER (ORDER BY rank) AS idx,
           count(*) OVER () AS cnt
    FROM public.playlist_tracks
    WHERE playlist_id = p_playlist_id
  ) r
  WHERE pt.id = r.id;
  UPDATE public.playlists SET ranks_rebalanced_at_version = p_version WHERE id = p_playlist_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.playlist_add_track(p_playlist_id uuid, p_track_id uuid, p_added_by uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v bigint;
  last_rank text;
  new_rank text;
  new_added_at timestamptz;
  rebalanced boolean := false;
BEGIN
  v := public.playlist_lock(p_playlist_id) + 1;

  IF EXISTS (SELECT 1 FROM public.playlist_tracks WHERE playlist_id = p_playlist_id AND track_id = p_track_id) THEN
    RAISE EXCEPTION 'TRACK_DUPLICATE';
  END IF;

  SELECT max(rank) INTO last_rank FROM public.playlist_tracks WHERE playlist_id = p_playlist_id;
  new_rank := public.rank_after(last_rank);

  INSERT INTO public.playlist_tracks (playlist_id, track_id, rank, moved_at_version, added_by)
  VALUES (p_playlist_id, p_track_id, new_rank, v, p_added_by)
  RETURNING added_at INTO new_added_at;

  UPDATE public.playlists SET tracks_version = v WHERE id = p_playlist_id;

  IF length(new_rank) > public.rank_max_length() THEN
    PERFORM public.playlist_rebalance(p_playlist_id, v);
    SELECT rank INTO new_rank FROM public.playlist_tracks WHERE playlist_id = p_playlist_id AND track_id = p_track_id;
    rebalanced := true;
  END IF;

  RETURN jsonb_build_object('rank', new_rank, 'tracksVersion', v, 'addedAt', new_added_at, 'rebalanced', rebalanced);
END;
$$;

CREATE OR REPLACE FUNCTION public.playlist_remove_track(p_playlist_id uuid, p_track_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v bigint;
BEGIN
  v := public.playlist_lock(p_playlist_id) + 1;

  DELETE FROM public.playlist_tracks WHERE playlist_id = p_playlist_id AND track_id = p_track_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'TRACK_NOT_IN_PLAYLIST';
  END IF;

  UPDATE public.playlists SET tracks_version = v WHERE id = p_playlist_id;
  RETURN jsonb_build_object('tracksVersion', v);
END;
$$;

CREATE OR REPLACE FUNCTION public.playlist_move_track(
  p_playlist_id uuid,
  p_track_id uuid,
  p_expected_version bigint,
  p_after_rank text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v bigint;
  track_moved_at bigint;
  rebalanced_at bigint;
  next_rank text;
  new_rank text;
  rebalanced boolean := false;
BEGIN
  v := public.playlist_lock(p_playlist_id) + 1;

  -- Checks in the order of the contract (doc/PLAYLIST_CONCURRENCY.md, Move).
  SELECT moved_at_version INTO track_moved_at
  FROM public.playlist_tracks WHERE playlist_id = p_playlist_id AND track_id = p_track_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'TRACK_NOT_IN_PLAYLIST';
  END IF;
  IF track_moved_at > p_expected_version THEN
    RAISE EXCEPTION 'TRACK_MOVED_CONCURRENTLY';
  END IF;

  SELECT ranks_rebalanced_at_version INTO rebalanced_at FROM public.playlists WHERE id = p_playlist_id;
  IF rebalanced_at > p_expected_version THEN
    RAISE EXCEPTION 'PLAYLIST_REBALANCED';
  END IF;

  -- The first other track after the drop point; nothing else lies between.
  SELECT min(rank) INTO next_rank
  FROM public.playlist_tracks
  WHERE playlist_id = p_playlist_id
    AND track_id <> p_track_id
    AND (p_after_rank IS NULL OR rank > p_after_rank COLLATE "C");

  new_rank := public.rank_between(p_after_rank, next_rank);

  UPDATE public.playlist_tracks
  SET rank = new_rank, moved_at_version = v
  WHERE playlist_id = p_playlist_id AND track_id = p_track_id;

  UPDATE public.playlists SET tracks_version = v WHERE id = p_playlist_id;

  IF length(new_rank) > public.rank_max_length() THEN
    PERFORM public.playlist_rebalance(p_playlist_id, v);
    SELECT rank INTO new_rank FROM public.playlist_tracks WHERE playlist_id = p_playlist_id AND track_id = p_track_id;
    rebalanced := true;
  END IF;

  RETURN jsonb_build_object('rank', new_rank, 'tracksVersion', v, 'rebalanced', rebalanced);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rank_max_length() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.playlist_lock(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.playlist_rebalance(uuid, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.playlist_add_track(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.playlist_remove_track(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.playlist_move_track(uuid, uuid, bigint, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rank_max_length() TO service_role;
GRANT EXECUTE ON FUNCTION public.playlist_lock(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.playlist_rebalance(uuid, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.playlist_add_track(uuid, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.playlist_remove_track(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.playlist_move_track(uuid, uuid, bigint, text) TO service_role;
