-- Ensure public reports view bypasses underlying RLS while exposing only safe fields
-- Recreate reports_public as a definer-security view (security_invoker=false)

DROP VIEW IF EXISTS public.reports_public;

CREATE VIEW public.reports_public
WITH (security_invoker = false)
AS
SELECT
  id,
  category,
  description,
  round(latitude::numeric, 2) AS latitude,
  round(longitude::numeric, 2) AS longitude,
  city_id,
  status,
  priority,
  photos,
  created_at,
  updated_at,
  sla_due_date,
  verified_at,
  resolved_at,
  is_deleted
FROM public.reports
WHERE (is_deleted = false OR is_deleted IS NULL);

-- Allow public read access to the view
GRANT SELECT ON public.reports_public TO anon;
GRANT SELECT ON public.reports_public TO authenticated;