-- =====================================================
-- 025: queue_transfer
-- Transfer of playback to a friend's device (#295): the tracks the sender
-- plays (their current track, then what follows in their queue) become a new
-- block right after the friend's current item, and the block's first item
-- becomes current. The block has no source playlist, so the playlist sync of
-- migration 023 never touches it. The caller checks the device license.
-- =====================================================

CREATE OR REPLACE FUNCTION public.queue_track_ids_from(p_user uuid, p_item_id uuid)
RETURNS uuid[]
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  from_rank text COLLATE "C";
BEGIN
  SELECT rank INTO from_rank FROM public.play_queue_items WHERE id = p_item_id AND user_id = p_user;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'QUEUE_ITEM_NOT_FOUND';
  END IF;
  RETURN ARRAY(
    SELECT track_id FROM public.play_queue_items
    WHERE user_id = p_user AND rank >= from_rank
    ORDER BY rank COLLATE "C"
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.queue_track_ids_upcoming(p_user uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
AS $$
  SELECT ARRAY(
    SELECT i.track_id FROM public.play_queue_items i
    WHERE i.user_id = p_user
      AND i.rank > coalesce(public.queue_current_rank(p_user), '')
    ORDER BY i.rank COLLATE "C"
  );
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

  PERFORM public.queue_set_current(p_user, first_id);
  RETURN public.queue_state(p_user);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.queue_track_ids_from(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_track_ids_from(uuid, uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.queue_track_ids_upcoming(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_track_ids_upcoming(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.queue_insert_block(uuid, uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_insert_block(uuid, uuid[]) TO service_role;
