-- Drop and recreate the view as SECURITY DEFINER to bypass RLS on reports table
DROP VIEW IF EXISTS public.reports_public;

CREATE VIEW public.reports_public 
WITH (security_invoker = false)
AS
SELECT 
    id,
    category,
    description,
    round(latitude::numeric, 3) AS latitude,
    round(longitude::numeric, 3) AS longitude,
    city_id,
    status,
    priority,
    photos,
    created_at,
    updated_at,
    verified_at,
    resolved_at,
    sla_due_date,
    is_deleted
FROM reports
WHERE is_deleted = false;

-- Grant access to the view for anonymous and authenticated users
GRANT SELECT ON public.reports_public TO anon;
GRANT SELECT ON public.reports_public TO authenticated;