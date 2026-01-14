-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
  category TEXT NOT NULL DEFAULT 'system', -- 'report', 'sla', 'assignment', 'system', 'admin'
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  report_updates BOOLEAN NOT NULL DEFAULT true,
  sla_warnings BOOLEAN NOT NULL DEFAULT true,
  assignment_alerts BOOLEAN NOT NULL DEFAULT true,
  weekly_digest BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system settings table for admin configuration
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general', -- 'general', 'sla', 'notifications', 'ai', 'security'
  updated_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Notifications policies (users can only see their own)
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Notification preferences policies
CREATE POLICY "Users can view their own preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin settings policies (admin only)
CREATE POLICY "Admins can view all settings"
  ON public.admin_settings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update settings"
  ON public.admin_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert settings"
  ON public.admin_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at on notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster notification queries
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Insert default admin settings
INSERT INTO public.admin_settings (key, value, description, category) VALUES
  ('sla_critical_hours', '24', 'Hours until critical priority reports are due', 'sla'),
  ('sla_high_hours', '72', 'Hours until high priority reports are due', 'sla'),
  ('sla_medium_hours', '168', 'Hours until medium priority reports are due', 'sla'),
  ('sla_low_hours', '336', 'Hours until low priority reports are due', 'sla'),
  ('email_notifications_enabled', 'true', 'Enable email notifications globally', 'notifications'),
  ('ai_auto_priority', 'true', 'Enable AI auto-priority scoring for new reports', 'ai'),
  ('ai_duplicate_detection', 'true', 'Enable AI duplicate detection for new reports', 'ai'),
  ('max_photos_per_report', '5', 'Maximum photos allowed per report', 'general'),
  ('maintenance_mode', 'false', 'Enable maintenance mode', 'system');

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;