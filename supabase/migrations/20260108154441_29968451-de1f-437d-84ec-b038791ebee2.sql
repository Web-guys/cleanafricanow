-- Add increment_user_impact function for volunteer/field agent tracking
CREATE OR REPLACE FUNCTION public.increment_user_impact(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    impact_score = COALESCE(impact_score, 0) + 10,
    reports_count = COALESCE(reports_count, 0) + 1
  WHERE id = user_id;
END;
$$;