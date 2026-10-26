-- =====================================================
-- 029: track_availability
-- A track deleted, made private or blocked on SoundCloud is marked
-- unavailable (unavailable_at); availability_checked_at says when the backend
-- last asked SoundCloud. An unavailable track never enters a queue and is
-- never made current:
--   queue_add_item, queue_play_item -> raise TRACK_UNAVAILABLE;
--   queue_play_playlist             -> copies the available tracks only;
--                                      TRACK_UNAVAILABLE for an unavailable
--                                      starting track, PLAYLIST_EMPTY when
--                                      none is available;
--   queue_step, queue_remove_item   -> skip items of unavailable tracks
--                                      (marked after they were queued);
--   queue_insert_block              -> copies the available tracks only,
--                                      QUEUE_BLOCK_EMPTY when none is.
-- =====================================================

ALTER TABLE public.tracks
  ADD COLUMN unavailable_at timestamptz,
  ADD COLUMN availability_checked_at timestamptz;

CREATE OR REPLACE FUNCTION public.track_unavailable(p_track_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tracks WHERE id = p_track_id AND unavailable_at IS NOT NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.queue_add_item(p_user uuid, p_track_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  last_rank text COLLATE "C";
  new_rank text COLLATE "C";
BEGIN
  IF public.track_unavailable(p_track_id) THEN
    RAISE EXCEPTION 'TRACK_UNAVAILABLE';
  END IF;

  PERFORM public.queue_lock(p_user);

  SELECT max(rank) INTO last_rank FROM public.play_queue_items WHERE user_id = p_user;
  new_rank := public.rank_after(last_rank);
  INSERT INTO public.play_queue_items (user_id, track_id, rank) VALUES (p_user, p_track_id, new_rank);
  UPDATE public.play_queues SET updated_at = now() WHERE user_id = p_user;

  IF length(new_rank) > public.rank_max_length() THEN
    PERFORM public.queue_rebalance(p_user);
  END IF;

  RETURN public.queue_state(p_user);
END;
$$;

CREATE OR REPLACE FUNCTION public.queue_play_item(p_user uuid, p_item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  item public.play_queue_items;
BEGIN
  PERFORM public.queue_lock(p_user);
  item := public.queue_find_item(p_user, p_item_id);
  IF public.track_unavailable(item.track_id) THEN
    RAISE EXCEPTION 'TRACK_UNAVAILABLE';
  END IF;
  PERFORM public.queue_set_current(p_user, item.id);
  RETURN public.queue_state(p_user);
END;
$$;

CREATE OR REPLACE FUNCTION public.queue_step(p_user uuid, p_direction text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  current_id uuid;
  current_rank text COLLATE "C";
  target_id uuid;
BEGIN
  IF p_direction NOT IN ('next', 'previous') THEN
    RAISE EXCEPTION 'QUEUE_INVALID_DIRECTION';
  END IF;

  current_id := public.queue_lock(p_user);
  IF current_id IS NOT NULL THEN
    SELECT rank INTO current_rank FROM public.play_queue_items WHERE id = current_id;
  END IF;

  IF p_direction = 'next' THEN
    SELECT id INTO target_id FROM public.play_queue_items
    WHERE user_id = p_user AND (current_rank IS NULL OR rank > current_rank)
      AND NOT public.track_unavailable(track_id)
    ORDER BY rank LIMIT 1;
    IF target_id IS NULL THEN
      RAISE EXCEPTION 'QUEUE_END';
    END IF;
  ELSE
    IF current_rank IS NOT NULL THEN
      SELECT id INTO target_id FROM public.play_queue_items
      WHERE user_id = p_user AND rank < current_rank
        AND NOT public.track_unavailable(track_id)
      ORDER BY rank DESC LIMIT 1;
    END IF;
    IF target_id IS NULL THEN
      RAISE EXCEPTION 'QUEUE_START';
    END IF;
  END IF;

  PERFORM public.queue_set_current(p_user, target_id);
  RETURN public.queue_state(p_user);
END;
$$;

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

  IF p_start_track_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.playlist_tracks
    WHERE track_id = p_start_track_id AND playlist_id = p_playlist_id
  ) THEN
    RAISE EXCEPTION 'PLAYLIST_TRACK_NOT_FOUND';
  END IF;

  IF p_start_track_id IS NOT NULL AND public.track_unavailable(p_start_track_id) THEN
    RAISE EXCEPTION 'TRACK_UNAVAILABLE';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.playlist_tracks
    WHERE playlist_id = p_playlist_id AND NOT public.track_unavailable(track_id)
  ) THEN
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
    WHERE playlist_id = p_playlist_id AND NOT public.track_unavailable(track_id)
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

CREATE OR REPLACE FUNCTION public.queue_remove_item(p_user uuid, p_item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  current_id uuid;
  item public.play_queue_items;
  next_id uuid;
BEGIN
  current_id := public.queue_lock(p_user);
  item := public.queue_find_item(p_user, p_item_id);

  PERFORM public.queue_detach_block(p_user, item.block_id);

  IF item.id = current_id THEN
    SELECT id INTO next_id FROM public.play_queue_items
    WHERE user_id = p_user AND rank > item.rank COLLATE "C"
      AND NOT public.track_unavailable(track_id)
    ORDER BY rank LIMIT 1;

    IF next_id IS NULL THEN
      -- Nothing left to play: the item and the history go.
      UPDATE public.play_queues SET current_item_id = NULL, updated_at = now() WHERE user_id = p_user;
      DELETE FROM public.play_queue_items WHERE user_id = p_user;
      RETURN public.queue_state(p_user);
    END IF;

    -- Delete first, so the history trim does not count the removed item.
    DELETE FROM public.play_queue_items WHERE id = item.id;
    PERFORM public.queue_set_current(p_user, next_id);
    RETURN public.queue_state(p_user);
  END IF;

  DELETE FROM public.play_queue_items WHERE id = item.id;
  UPDATE public.play_queues SET updated_at = now() WHERE user_id = p_user;
  RETURN public.queue_state(p_user);
END;
$$;

CREATE OR REPLACE FUNCTION public.queue_insert_block(p_user uuid, p_track_ids uuid[])
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
  -- Checked before the lock so that a refusal changes nothing.
  IF coalesce(array_length(p_track_ids, 1), 0) = 0 THEN
    RAISE EXCEPTION 'QUEUE_BLOCK_EMPTY';
  END IF;

  current_id := public.queue_lock(p_user);

  IF current_id IS NOT NULL THEN
    SELECT rank INTO prev_rank FROM public.play_queue_items WHERE id = current_id;
  END IF;

  -- The first upcoming item: the block goes between the current item and it.
  SELECT min(rank) INTO next_rank
  FROM public.play_queue_items
  WHERE user_id = p_user AND (prev_rank IS NULL OR rank > prev_rank);

  FOR track IN
    SELECT t.track_id FROM unnest(p_track_ids) WITH ORDINALITY AS t(track_id, ordinality)
    WHERE NOT public.track_unavailable(t.track_id)
    ORDER BY t.ordinality
  LOOP
    -- With nothing after the block, rank_after keeps the keys short.
    IF next_rank IS NULL THEN
      new_rank := public.rank_after(prev_rank);
    ELSE
      new_rank := public.rank_between(prev_rank, next_rank);
    END IF;

    INSERT INTO public.play_queue_items (user_id, track_id, rank, source_playlist_id, block_id, block_detached)
    VALUES (p_user, track.track_id, new_rank, NULL, new_block, false)
    RETURNING id INTO item_id;
    first_id := coalesce(first_id, item_id);

    -- Same rule as queue_play_playlist: rebalance as soon as a key grows too long.
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

  IF first_id IS NULL THEN
    RAISE EXCEPTION 'QUEUE_BLOCK_EMPTY';
  END IF;

  PERFORM public.queue_set_current(p_user, first_id);
  RETURN public.queue_state(p_user);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.track_unavailable(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_unavailable(uuid) TO service_role;
