
CREATE OR REPLACE FUNCTION public.queue_sync_users(p_playlist_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT i.user_id FROM public.play_queue_items i
  JOIN public.playlists p ON p.id = i.source_playlist_id
  WHERE i.source_playlist_id = p_playlist_id AND i.block_id IS NOT NULL AND NOT i.block_detached
    AND (
      p.visibility = 'public'
      OR p.owner_id = i.user_id
      OR i.user_id = ANY (coalesce(p.collaborator_ids, '{}'))
      OR i.user_id = ANY (coalesce(p.viewer_ids, '{}'))
    )
  ORDER BY i.user_id;
$$;

CREATE OR REPLACE FUNCTION public.queue_sync_blocks(p_user uuid, p_playlist_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
AS $$
  SELECT block_id FROM public.play_queue_items
  WHERE user_id = p_user AND source_playlist_id = p_playlist_id
    AND block_id IS NOT NULL AND NOT block_detached
  GROUP BY block_id
  ORDER BY min(rank);
$$;

CREATE OR REPLACE FUNCTION public.queue_current_rank(p_user uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT i.rank FROM public.play_queues q
  JOIN public.play_queue_items i ON i.id = q.current_item_id
  WHERE q.user_id = p_user;
$$;

CREATE OR REPLACE FUNCTION public.queue_rank_after(p_user uuid, p_after text, p_exclude uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  next_rank text COLLATE "C";
BEGIN
  SELECT min(rank) INTO next_rank
  FROM public.play_queue_items
  WHERE user_id = p_user
    AND (p_exclude IS NULL OR id <> p_exclude)
    AND (p_after IS NULL OR rank > p_after COLLATE "C");

  IF next_rank IS NULL THEN
    RETURN public.rank_after(p_after);
  END IF;
  RETURN public.rank_between(p_after, next_rank);
END;
$$;

CREATE OR REPLACE FUNCTION public.queue_sync_track_added(p_playlist_id uuid, p_track_id uuid)
RETURNS uuid[]
LANGUAGE plpgsql
AS $$
DECLARE
  affected uuid[] := '{}';
  u uuid;
  blk uuid;
  current_rank text COLLATE "C";
  last_rank text COLLATE "C";
  new_rank text COLLATE "C";
  changed boolean;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.playlist_tracks WHERE playlist_id = p_playlist_id AND track_id = p_track_id
  ) THEN
    RETURN affected;
  END IF;

  FOR u IN SELECT public.queue_sync_users(p_playlist_id) LOOP
    PERFORM public.queue_lock(u);
    current_rank := public.queue_current_rank(u);
    changed := false;

    FOR blk IN SELECT public.queue_sync_blocks(u, p_playlist_id) LOOP
      CONTINUE WHEN EXISTS (
        SELECT 1 FROM public.play_queue_items
        WHERE user_id = u AND block_id = blk AND track_id = p_track_id
          AND (current_rank IS NULL OR rank > current_rank)
      );

      SELECT max(rank) INTO last_rank FROM public.play_queue_items WHERE user_id = u AND block_id = blk;
      CONTINUE WHEN current_rank IS NOT NULL AND last_rank <= current_rank;

      new_rank := public.queue_rank_after(u, last_rank, NULL);
      INSERT INTO public.play_queue_items (user_id, track_id, rank, source_playlist_id, block_id, block_detached)
      VALUES (u, p_track_id, new_rank, p_playlist_id, blk, false);
      changed := true;

      IF length(new_rank) > public.rank_max_length() THEN
        PERFORM public.queue_rebalance(u);
        current_rank := public.queue_current_rank(u);
      END IF;
    END LOOP;

    IF changed THEN
      UPDATE public.play_queues SET updated_at = now() WHERE user_id = u;
      affected := affected || u;
    END IF;
  END LOOP;

  RETURN affected;
END;
$$;

CREATE OR REPLACE FUNCTION public.queue_sync_track_removed(p_playlist_id uuid, p_track_id uuid)
RETURNS uuid[]
LANGUAGE plpgsql
AS $$
DECLARE
  affected uuid[] := '{}';
  u uuid;
  current_rank text COLLATE "C";
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.playlist_tracks WHERE playlist_id = p_playlist_id AND track_id = p_track_id
  ) THEN
    RETURN affected;
  END IF;

  FOR u IN SELECT public.queue_sync_users(p_playlist_id) LOOP
    PERFORM public.queue_lock(u);
    current_rank := public.queue_current_rank(u);

    DELETE FROM public.play_queue_items
    WHERE user_id = u
      AND track_id = p_track_id
      AND block_id IN (SELECT public.queue_sync_blocks(u, p_playlist_id))
      AND (current_rank IS NULL OR rank > current_rank);

    IF FOUND THEN
      UPDATE public.play_queues SET updated_at = now() WHERE user_id = u;
      affected := affected || u;
    END IF;
  END LOOP;

  RETURN affected;
END;
$$;

CREATE OR REPLACE FUNCTION public.queue_sync_track_moved(p_playlist_id uuid, p_track_id uuid)
RETURNS uuid[]
LANGUAGE plpgsql
AS $$
DECLARE
  affected uuid[] := '{}';
  u uuid;
  blk uuid;
  moved_rank text COLLATE "C";
  current_rank text COLLATE "C";
  item public.play_queue_items;
  anchor_rank text COLLATE "C";
  first_rank text COLLATE "C";
  after_rank text COLLATE "C";
  next_id uuid;
  new_rank text COLLATE "C";
  changed boolean;
BEGIN
  SELECT rank INTO moved_rank FROM public.playlist_tracks
  WHERE playlist_id = p_playlist_id AND track_id = p_track_id;
  IF NOT FOUND THEN
    RETURN affected;
  END IF;

  FOR u IN SELECT public.queue_sync_users(p_playlist_id) LOOP
    PERFORM public.queue_lock(u);
    current_rank := public.queue_current_rank(u);
    changed := false;

    FOR blk IN SELECT public.queue_sync_blocks(u, p_playlist_id) LOOP
      SELECT * INTO item FROM public.play_queue_items
      WHERE user_id = u AND block_id = blk AND track_id = p_track_id
      ORDER BY rank LIMIT 1;
      CONTINUE WHEN NOT FOUND;
      CONTINUE WHEN current_rank IS NOT NULL AND item.rank <= current_rank;

      anchor_rank := NULL;
      SELECT qi.rank INTO anchor_rank
      FROM public.playlist_tracks pt
      JOIN public.play_queue_items qi
        ON qi.track_id = pt.track_id AND qi.user_id = u AND qi.block_id = blk
      WHERE pt.playlist_id = p_playlist_id
        AND pt.rank COLLATE "C" < moved_rank
        AND qi.id <> item.id
      ORDER BY pt.rank COLLATE "C" DESC
      LIMIT 1;

      IF anchor_rank IS NOT NULL THEN
        CONTINUE WHEN current_rank IS NOT NULL AND anchor_rank < current_rank;
        after_rank := anchor_rank;
      ELSE
        SELECT min(rank) INTO first_rank FROM public.play_queue_items
        WHERE user_id = u AND block_id = blk AND id <> item.id;
        CONTINUE WHEN first_rank IS NULL;
        CONTINUE WHEN current_rank IS NOT NULL AND first_rank <= current_rank;
        SELECT max(rank) INTO after_rank FROM public.play_queue_items
        WHERE user_id = u AND id <> item.id AND rank < first_rank;
      END IF;

      SELECT id INTO next_id FROM public.play_queue_items
      WHERE user_id = u AND (after_rank IS NULL OR rank > after_rank)
      ORDER BY rank LIMIT 1;
      CONTINUE WHEN next_id = item.id;

      new_rank := public.queue_rank_after(u, after_rank, item.id);
      UPDATE public.play_queue_items SET rank = new_rank WHERE id = item.id;
      changed := true;

      IF length(new_rank) > public.rank_max_length() THEN
        PERFORM public.queue_rebalance(u);
        current_rank := public.queue_current_rank(u);
      END IF;
    END LOOP;

    IF changed THEN
      UPDATE public.play_queues SET updated_at = now() WHERE user_id = u;
      affected := affected || u;
    END IF;
  END LOOP;

  RETURN affected;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.queue_sync_users(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_sync_blocks(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_current_rank(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_rank_after(uuid, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_sync_track_added(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_sync_track_removed(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_sync_track_moved(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_sync_users(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_sync_blocks(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_current_rank(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_rank_after(uuid, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_sync_track_added(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_sync_track_removed(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_sync_track_moved(uuid, uuid) TO service_role;
