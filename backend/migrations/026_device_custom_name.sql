
ALTER TABLE public.devices
  ADD COLUMN IF NOT EXISTS custom_name TEXT
  CONSTRAINT devices_custom_name_length CHECK (char_length(custom_name) BETWEEN 1 AND 40);

COMMENT ON COLUMN public.devices.custom_name IS
  'Name chosen by the owner (1-40 characters); NULL shows device_name, the system name';
