-- =====================================================
-- 032: events
-- Physical events (party, concert, bar) any user registers, for the
-- proximity bonus (V.2). Purely informative: no vote, no track queue.
-- Every event is public; the backend returns its coordinates and the phone
-- computes the distance, so the user's position never reaches the server.
-- beacon_minor is the minor of the iBeacon frame the organiser's phone
-- broadcasts. It is unique over every row, ended events included, so two
-- active events never share one; the backend picks a free value at random.
-- =====================================================

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description TEXT CHECK (char_length(description) <= 500),
  address TEXT NOT NULL CHECK (char_length(address) BETWEEN 1 AND 200),
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  access_info TEXT CHECK (char_length(access_info) <= 500),
  genres TEXT[] NOT NULL DEFAULT '{}',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE SET NULL,
  beacon_minor INTEGER NOT NULL UNIQUE CHECK (beacon_minor BETWEEN 1 AND 65535),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT events_ends_after_start CHECK (ends_at > starts_at)
);

CREATE INDEX events_ends_at_idx ON public.events (ends_at);
CREATE INDEX events_owner_id_idx ON public.events (owner_id);
CREATE INDEX events_playlist_id_idx ON public.events (playlist_id);

CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Only the backend (service role) reads and writes events, as in 017.
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.events FROM anon, authenticated;
