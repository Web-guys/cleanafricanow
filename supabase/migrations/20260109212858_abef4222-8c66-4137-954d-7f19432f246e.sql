-- Fix infinite recursion in reports UPDATE policies by avoiding direct reads of profiles (which has an RLS policy referencing reports)

-- 1) Create a SECURITY DEFINER helper to fetch a user's city_id without invoking profiles RLS
CREATE OR REPLACE FUNCTION public.get_profile_city_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT city_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- 2) Replace municipality UPDATE policy to use the helper function (prevents recursion)
DROP POLICY IF EXISTS "Municipality can update reports in their city" ON public.reports;

CREATE POLICY "Municipality can update reports in their city"
ON public.reports
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'municipality'::app_role)
  AND city_id IS NOT NULL
  AND city_id = public.get_profile_city_id(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'municipality'::app_role)
  AND city_id IS NOT NULL
  AND city_id = public.get_profile_city_id(auth.uid())
);
