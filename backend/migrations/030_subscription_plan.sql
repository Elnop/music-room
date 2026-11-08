
ALTER TABLE public.user_profiles
  ADD COLUMN plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  ADD COLUMN plan_changed_at timestamptz;
