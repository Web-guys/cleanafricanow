-- Create countries table for managing countries
CREATE TABLE public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE, -- ISO country code (e.g., MA, DZ, TN)
  continent text,
  flag_emoji text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add some default African countries
INSERT INTO public.countries (name, code, continent, flag_emoji) VALUES
  ('Morocco', 'MA', 'Africa', '🇲🇦'),
  ('Algeria', 'DZ', 'Africa', '🇩🇿'),
  ('Tunisia', 'TN', 'Africa', '🇹🇳'),
  ('Egypt', 'EG', 'Africa', '🇪🇬'),
  ('Senegal', 'SN', 'Africa', '🇸🇳'),
  ('Nigeria', 'NG', 'Africa', '🇳🇬'),
  ('Kenya', 'KE', 'Africa', '🇰🇪'),
  ('South Africa', 'ZA', 'Africa', '🇿🇦'),
  ('Ghana', 'GH', 'Africa', '🇬🇭'),
  ('Ivory Coast', 'CI', 'Africa', '🇨🇮');

-- Enable RLS
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

-- Anyone can view countries
CREATE POLICY "Anyone can view countries"
ON public.countries FOR SELECT
USING (true);

-- Only admins can manage countries
CREATE POLICY "Admins can manage countries"
ON public.countries FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_countries_updated_at
BEFORE UPDATE ON public.countries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();