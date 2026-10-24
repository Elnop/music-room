-- =====================================================
-- 028: queue_play_playlist_from_track
-- queue_play_playlist takes an optional starting track: p_start_track_id is the
-- id of a track of the playlist (tracks.id, unique per playlist, as for the
-- other playlist track operations). The whole playlist is still copied as
-- one block, so the tracks before the starting one stay in the queue as its
-- previous items; only the item made current changes. Without it, the first
-- track plays, as before. A track that is not in the playlist raises
-- PLAYLIST_TRACK_NOT_FOUND.
-- =====================================================

DROP FUNCTION IF EXISTS public.queue_play_playlist(uuid, uuid);

CREATE OR REPLACE FUNCTION public.queue_play_playlist(
  p_user uuid,
  p_playlist_id uuid,
  p_start_track_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  current_id uuid;
  prev_rank text COLLATE "C";
  next_rank text COLLATE "C";
  new_rank text COLLATE "C";
  new_block uuid := gen_random_uuid();
  item_id uuid;
  first_id uuid;
  start_id uuid;
  track record;
BEGIN
  current_id := public.queue_lock(p_user);

  -- The service checked access before the call; the playlist may have been
  -- deleted since. The share lock keeps it (and its tracks) until commit.
  PERFORM 1 FROM public.playlists WHERE id = p_playlist_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PLAYLIST_NOT_FOUND';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.playlist_tracks WHERE playlist_id = p_playlist_id) THEN
    RAISE EXCEPTION 'PLAYLIST_EMPTY';
  END IF;

  IF p_start_track_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.playlist_tracks
    WHERE track_id = p_start_track_id AND playlist_id = p_playlist_id
  ) THEN
    RAISE EXCEPTION 'PLAYLIST_TRACK_NOT_FOUND';
  END IF;

  IF current_id IS NOT NULL THEN
    SELECT rank INTO prev_rank FROM public.play_queue_items WHERE id = current_id;
  END IF;

  -- The first upcoming item: the block goes between the current item and it.
  SELECT min(rank) INTO next_rank
  FROM public.play_queue_items
  WHERE user_id = p_user AND (prev_rank IS NULL OR rank > prev_rank);

  FOR track IN
    SELECT track_id FROM public.playlist_tracks
    WHERE playlist_id = p_playlist_id
    ORDER BY rank COLLATE "C"
  LOOP
    -- With nothing after the block, rank_after keeps the keys short.
    IF next_rank IS NULL THEN
      new_rank := public.rank_after(prev_rank);
    ELSE
      new_rank := public.rank_between(prev_rank, next_rank);
    END IF;

    INSERT INTO public.play_queue_items (user_id, track_id, rank, source_playlist_id, block_id, block_detached)
    VALUES (p_user, track.track_id, new_rank, p_playlist_id, new_block, false)
    RETURNING id INTO item_id;
    first_id := coalesce(first_id, item_id);
    IF track.track_id = p_start_track_id THEN
      start_id := item_id;
    END IF;

    -- Same rule as the other operations, applied as soon as a key grows too
    -- long, so a long playlist never reaches the rank format's length limit.
    IF length(new_rank) > public.rank_max_length() THEN
      PERFORM public.queue_rebalance(p_user);
      SELECT rank INTO prev_rank FROM public.play_queue_items WHERE id = item_id;
      SELECT min(rank) INTO next_rank
      FROM public.play_queue_items
      WHERE user_id = p_user AND rank > prev_rank;
    ELSE
      prev_rank := new_rank;
    END IF;
  END LOOP;

  PERFORM public.queue_set_current(p_user, coalesce(start_id, first_id));
  RETURN public.queue_state(p_user);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.queue_play_playlist(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_play_playlist(uuid, uuid, uuid) TO service_role;
