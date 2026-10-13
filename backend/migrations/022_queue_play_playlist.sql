-- =====================================================
-- 022: queue_play_playlist
-- Plays a whole playlist through the caller's queue (#277): its tracks, in
-- playlist rank order, become a new block placed right after the current item
-- (at the top when nothing is current), and the block's first item becomes
-- current. The item that was playing becomes history; the upcoming items
-- follow the block. Reuses migration 021's lock, current-item and rebalance
-- functions. The caller checks that the user can view the playlist.
-- =====================================================

CREATE OR REPLACE FUNCTION public.queue_play_playlist(p_user uuid, p_playlist_id uuid)
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

  PERFORM public.queue_set_current(p_user, first_id);
  RETURN public.queue_state(p_user);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.queue_play_playlist(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_play_playlist(uuid, uuid) TO service_role;
