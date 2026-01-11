-- Grant SELECT access to reports_public view for anonymous users
GRANT SELECT ON public.reports_public TO anon;
GRANT SELECT ON public.reports_public TO authenticated;

-- Also ensure the cities table is accessible for map display
GRANT SELECT ON public.cities TO anon;
GRANT SELECT ON public.cities TO authenticated;