-- Music Room - Migration 012 (No-op for existing databases)
-- 
-- NOTE: This migration has been merged into 011 for new installations.
-- For databases that already ran the original 011 + 012, this file exists
-- only to maintain migration history consistency.
--
-- The changes (replacing location_visibility with avatar_visibility) 
-- are already applied if you ran the original migrations.

-- No operations needed - changes already applied or handled by updated 011
SELECT 1;

