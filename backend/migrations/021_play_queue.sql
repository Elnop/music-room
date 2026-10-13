-- =====================================================
-- 021: play_queue
-- One play queue per user, shared by all of their devices (#272, #273).
-- Ranks reuse migration 016 (rank_after, rank_between, rank_spaced, rank_max_length).
-- =====================================================

-- One row per user: the item playing now and the lock that serializes the
-- user's writers (queue_lock).
CREATE TABLE public.play_queues (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_item_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Items in rank order. Items ranked before the current one are history, those
-- after it are upcoming; with no current item every item is upcoming.
CREATE TABLE public.play_queue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.play_queues(user_id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  rank text COLLATE "C" NOT NULL,
  source_playlist_id uuid REFERENCES public.playlists(id) ON DELETE SET NULL,
  block_id uuid,
  block_detached boolean NOT NULL DEFAULT false,
  added_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT play_queue_items_rank_format CHECK (rank ~ '^[0-9A-Za-z]*[1-9A-Za-z]$' AND length(rank) <= 128),
  CONSTRAINT play_queue_items_rank_unique UNIQUE (user_id, rank) DEFERRABLE INITIALLY IMMEDIATE,
  CONSTRAINT play_queue_items_id_user_unique UNIQUE (id, user_id)
);

CREATE INDEX idx_play_queue_items_block ON public.play_queue_items (user_id, block_id) WHERE block_id IS NOT NULL;
CREATE INDEX idx_play_queue_items_track ON public.play_queue_items (track_id);

-- The current item is one of the user's own items; deleting it clears the pointer.
ALTER TABLE public.play_queues
  ADD CONSTRAINT play_queues_current_item_fkey
  FOREIGN KEY (current_item_id, user_id)
  REFERENCES public.play_queue_items(id, user_id)
  ON DELETE SET NULL (current_item_id);

COMMENT ON TABLE public.play_queues IS 'One play queue per user; written only by the queue_* functions';
COMMENT ON TABLE public.play_queue_items IS 'Queue items in rank order; written only by the queue_* functions';
COMMENT ON COLUMN public.play_queue_items.rank IS 'Sort key: base-62 fraction, compared byte by byte (doc/PLAYLIST_CONCURRENCY.md)';
COMMENT ON COLUMN public.play_queue_items.block_id IS 'Items queued together from one playlist share a block';
COMMENT ON COLUMN public.play_queue_items.block_detached IS 'Set on the whole block once the user removes or moves one of its items';

-- No direct access with the anon key (migration 017): only service_role, through the functions.
REVOKE ALL ON public.play_queues FROM anon, authenticated;
REVOKE ALL ON public.play_queue_items FROM anon, authenticated;
ALTER TABLE public.play_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.play_queue_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Operations: one function per operation, serialized per user
-- =====================================================

-- History kept behind the current item after a step forward.
CREATE OR REPLACE FUNCTION public.queue_history_max()
RETURNS int LANGUAGE sql IMMUTABLE AS $$ SELECT 50 $$;

-- Creates the user's queue row if needed and locks it; every operation calls
-- it first, so the writers of one user run one at a time and cannot deadlock.
-- Returns the current item id.
CREATE OR REPLACE FUNCTION public.queue_lock(p_user uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  current_id uuid;
BEGIN
  INSERT INTO public.play_queues (user_id) VALUES (p_user) ON CONFLICT (user_id) DO NOTHING;
  SELECT current_item_id INTO current_id FROM public.play_queues WHERE user_id = p_user FOR UPDATE;
  RETURN current_id;
END;
$$;

-- The full queue: { currentItemId, items } with items in rank order.
CREATE OR REPLACE FUNCTION public.queue_state(p_user uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'currentItemId', (SELECT current_item_id FROM public.play_queues WHERE user_id = p_user),
    'items', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', i.id,
        'rank', i.rank,
        'track', jsonb_build_object(
          'trackUri', t.track_uri,
          'title', t.title,
          'artist', t.artist,
          'album', t.album,
          'albumArt', t.album_art,
          'durationMs', t.duration_ms
        ),
        'sourcePlaylistId', i.source_playlist_id,
        'blockId', i.block_id,
        'blockDetached', i.block_detached
      ) ORDER BY i.rank)
      FROM public.play_queue_items i
      JOIN public.tracks t ON t.id = i.track_id
      WHERE i.user_id = p_user
    ), '[]'::jsonb)
  );
$$;

-- Respaces every rank of the user's queue, keeping the order. Caller holds the lock.
CREATE OR REPLACE FUNCTION public.queue_rebalance(p_user uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  SET CONSTRAINTS public.play_queue_items_rank_unique DEFERRED;
  UPDATE public.play_queue_items qi
  SET rank = public.rank_spaced(r.idx, r.cnt)
  FROM (
    SELECT id,
           row_number() OVER (ORDER BY rank) AS idx,
           count(*) OVER () AS cnt
    FROM public.play_queue_items
    WHERE user_id = p_user
  ) r
  WHERE qi.id = r.id;
END;
$$;

-- Sets the current item and drops the history beyond queue_history_max().
-- Caller holds the lock.
CREATE OR REPLACE FUNCTION public.queue_set_current(p_user uuid, p_item_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  current_rank text COLLATE "C";
BEGIN
  UPDATE public.play_queues SET current_item_id = p_item_id, updated_at = now() WHERE user_id = p_user;
  IF p_item_id IS NULL THEN
    RETURN;
  END IF;

  SELECT rank INTO current_rank FROM public.play_queue_items WHERE id = p_item_id;
  DELETE FROM public.play_queue_items
  WHERE user_id = p_user
    AND rank < current_rank
    AND id NOT IN (
      SELECT id FROM public.play_queue_items
      WHERE user_id = p_user AND rank < current_rank
      ORDER BY rank DESC
      LIMIT public.queue_history_max()
    );
END;
$$;

-- An item of the user's queue; raises QUEUE_ITEM_NOT_FOUND for an unknown item
-- or one of another user (no existence leak). Takes no row lock: the caller
-- must hold queue_lock.
CREATE OR REPLACE FUNCTION public.queue_find_item(p_user uuid, p_item_id uuid)
RETURNS public.play_queue_items
LANGUAGE plpgsql
AS $$
DECLARE
  item public.play_queue_items;
BEGIN
  SELECT * INTO item FROM public.play_queue_items WHERE id = p_item_id AND user_id = p_user;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'QUEUE_ITEM_NOT_FOUND';
  END IF;
  RETURN item;
END;
$$;

-- A user mutation of one item of a block detaches the whole block.
CREATE OR REPLACE FUNCTION public.queue_detach_block(p_user uuid, p_block_id uuid)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE public.play_queue_items SET block_detached = true
  WHERE p_block_id IS NOT NULL AND user_id = p_user AND block_id = p_block_id;
$$;

-- Appends a track after the last item; the current item is unchanged.
CREATE OR REPLACE FUNCTION public.queue_add_item(p_user uuid, p_track_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  last_rank text COLLATE "C";
  new_rank text COLLATE "C";
BEGIN
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

-- Removes an item. Removing the current item acts as a skip: the next item
-- becomes current; with none, the queue is emptied.
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

-- Moves an upcoming item right after p_after_item_id (NULL = right after the
-- current item, or the top when there is none). Both must be upcoming.
CREATE OR REPLACE FUNCTION public.queue_move_item(p_user uuid, p_item_id uuid, p_after_item_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  current_id uuid;
  current_rank text COLLATE "C";
  item public.play_queue_items;
  after_rank text COLLATE "C";
  next_rank text COLLATE "C";
  new_rank text COLLATE "C";
BEGIN
  current_id := public.queue_lock(p_user);
  item := public.queue_find_item(p_user, p_item_id);
  IF current_id IS NOT NULL THEN
    SELECT rank INTO current_rank FROM public.play_queue_items WHERE id = current_id;
  END IF;

  IF current_rank IS NOT NULL AND item.rank COLLATE "C" <= current_rank THEN
    RAISE EXCEPTION 'QUEUE_ITEM_NOT_UPCOMING';
  END IF;

  IF p_after_item_id IS NULL THEN
    after_rank := current_rank;
  ELSE
    after_rank := (public.queue_find_item(p_user, p_after_item_id)).rank;
    IF current_rank IS NOT NULL AND after_rank <= current_rank THEN
      RAISE EXCEPTION 'QUEUE_ITEM_NOT_UPCOMING';
    END IF;
  END IF;

  -- The first other item after the drop point; nothing else lies between.
  SELECT min(rank) INTO next_rank
  FROM public.play_queue_items
  WHERE user_id = p_user
    AND id <> item.id
    AND (after_rank IS NULL OR rank > after_rank);

  new_rank := public.rank_between(after_rank, next_rank);
  UPDATE public.play_queue_items SET rank = new_rank WHERE id = item.id;
  PERFORM public.queue_detach_block(p_user, item.block_id);
  UPDATE public.play_queues SET updated_at = now() WHERE user_id = p_user;

  IF length(new_rank) > public.rank_max_length() THEN
    PERFORM public.queue_rebalance(p_user);
  END IF;

  RETURN public.queue_state(p_user);
END;
$$;

-- Plays any item of the queue: the items before it become history.
CREATE OR REPLACE FUNCTION public.queue_play_item(p_user uuid, p_item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  item public.play_queue_items;
BEGIN
  PERFORM public.queue_lock(p_user);
  item := public.queue_find_item(p_user, p_item_id);
  PERFORM public.queue_set_current(p_user, item.id);
  RETURN public.queue_state(p_user);
END;
$$;

-- Moves the current item one step: 'next' (from no current item, the first
-- item) or 'previous'. Raises QUEUE_END / QUEUE_START when there is none.
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
    ORDER BY rank LIMIT 1;
    IF target_id IS NULL THEN
      RAISE EXCEPTION 'QUEUE_END';
    END IF;
  ELSE
    IF current_rank IS NOT NULL THEN
      SELECT id INTO target_id FROM public.play_queue_items
      WHERE user_id = p_user AND rank < current_rank
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

REVOKE EXECUTE ON FUNCTION public.queue_history_max() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_lock(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_state(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_rebalance(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_set_current(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_find_item(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_detach_block(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_add_item(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_remove_item(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_move_item(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_play_item(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_step(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_history_max() TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_lock(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_state(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_rebalance(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_set_current(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_find_item(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_detach_block(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_add_item(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_remove_item(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_move_item(uuid, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_play_item(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_step(uuid, text) TO service_role;
