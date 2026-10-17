-- =====================================================
-- 026: device_custom_name
-- The name the owner gives one of their devices (#352). device_name stays the
-- system name, refreshed on every connection; custom_name is never touched by
-- that refresh. The API shows custom_name when set, device_name otherwise.
-- NULL means "use the system name".
-- =====================================================

ALTER TABLE public.devices
  ADD COLUMN IF NOT EXISTS custom_name TEXT
  CONSTRAINT devices_custom_name_length CHECK (char_length(custom_name) BETWEEN 1 AND 40);

COMMENT ON COLUMN public.devices.custom_name IS
  'Name chosen by the owner (1-40 characters); NULL shows device_name, the system name';
