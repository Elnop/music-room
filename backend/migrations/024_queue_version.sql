
ALTER TABLE public.play_queues ADD COLUMN version bigint NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.play_queues.version IS 'Incremented by every write that changes the queue';

CREATE OR REPLACE FUNCTION public.queue_bump_version()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.version := OLD.version + 1;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bump_play_queues_version
  BEFORE UPDATE ON public.play_queues
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_bump_version();

REVOKE EXECUTE ON FUNCTION public.queue_bump_version() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.queue_state(p_user uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'ownerId', p_user,
    'version', coalesce((SELECT version FROM public.play_queues WHERE user_id = p_user), 0),
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
