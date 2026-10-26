-- =====================================================
-- 030: subscription_plan
-- Each user is on the free or the premium plan (bonus V.3). There is no
-- payment: PUT /api/subscription switches the plan at once and stamps
-- plan_changed_at (null while the user never switched).
-- =====================================================

ALTER TABLE public.user_profiles
  ADD COLUMN plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  ADD COLUMN plan_changed_at timestamptz;
