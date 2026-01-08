
-- Fix permissive RLS policies for report_history and user_activity_logs

-- Drop the overly permissive INSERT policies
DROP POLICY IF EXISTS "System can insert history" ON public.report_history;
DROP POLICY IF EXISTS "System can insert logs" ON public.user_activity_logs;

-- Create proper INSERT policies that require authentication
CREATE POLICY "Authenticated users can insert history"
ON public.report_history FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert logs"
ON public.user_activity_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
