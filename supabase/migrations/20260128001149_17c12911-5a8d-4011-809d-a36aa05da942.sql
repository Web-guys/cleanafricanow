-- Add is_featured column to cities table
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cities_is_featured ON public.cities(is_featured) WHERE is_featured = true;

-- Mark some initial cities as featured (top cities by population)
UPDATE public.cities SET is_featured = true 
WHERE name IN ('Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda');