-- =====================================================
-- 033: taste_recommendations
-- Profiles whose music genres overlap the caller's, best match first:
-- Jaccard similarity of the two genre sets, then the number of shared
-- genres. Only profiles whose music preferences are public are candidates
-- (a missing privacy row means public, as in the backend), so a suggestion
-- never reveals friends-only or private tastes. The caller and the profiles
-- the caller already follows are left out.
-- =====================================================

CREATE OR REPLACE FUNCTION public.recommend_similar_profiles(p_user uuid, p_limit integer)
RETURNS TABLE (user_id uuid, common_genres text[], score double precision)
LANGUAGE sql
STABLE
AS $$
  WITH mine AS (
    SELECT genres FROM public.music_preferences WHERE user_id = p_user
  ),
  candidates AS (
    SELECT
      mp.user_id,
      cardinality(mp.genres) AS their_count,
      ARRAY(
        SELECT g FROM unnest(mp.genres) AS g WHERE g = ANY (mine.genres) ORDER BY g
      ) AS common_genres,
      cardinality(mine.genres) AS my_count
    FROM mine
    JOIN public.music_preferences mp ON mp.genres && mine.genres
    WHERE mp.user_id <> p_user
      AND NOT EXISTS (
        SELECT 1 FROM public.profile_privacy pp
        WHERE pp.user_id = mp.user_id
          AND COALESCE(pp.music_preferences_visibility, 'public') <> 'public'
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.follows f
        WHERE f.follower_id = p_user AND f.following_id = mp.user_id
      )
  )
  SELECT
    c.user_id,
    c.common_genres,
    cardinality(c.common_genres)::double precision
      / (c.my_count + c.their_count - cardinality(c.common_genres)) AS score
  FROM candidates c
  ORDER BY score DESC, cardinality(c.common_genres) DESC, c.user_id
  LIMIT p_limit;
$$;

REVOKE EXECUTE ON FUNCTION public.recommend_similar_profiles(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recommend_similar_profiles(uuid, integer) TO service_role;
