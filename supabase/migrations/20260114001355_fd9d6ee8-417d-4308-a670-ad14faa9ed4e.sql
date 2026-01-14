-- Fix the overly permissive insert policy on notifications
-- Only authenticated users or system (via service role) should insert
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create a more restrictive policy: admin/municipality/ngo can create notifications for users in their scope
CREATE POLICY "Authorized roles can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'municipality')
    OR public.has_role(auth.uid(), 'ngo')
  );