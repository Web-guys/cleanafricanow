-- Add region column to cities for better organization
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS population integer;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS is_municipality boolean DEFAULT true;

-- Create index for faster region filtering
CREATE INDEX IF NOT EXISTS idx_cities_region ON public.cities(region);
CREATE INDEX IF NOT EXISTS idx_cities_country ON public.cities(country);

-- Insert all major Moroccan regions and cities
-- Casablanca-Settat Region
INSERT INTO public.cities (name, country, region, latitude, longitude, population, is_municipality) VALUES
-- Major cities
('Casablanca', 'Morocco', 'Casablanca-Settat', 33.5731, -7.5898, 3359818, true),
('Mohammedia', 'Morocco', 'Casablanca-Settat', 33.6861, -7.3833, 208612, true),
('El Jadida', 'Morocco', 'Casablanca-Settat', 33.2316, -8.5007, 194934, true),
('Settat', 'Morocco', 'Casablanca-Settat', 33.0017, -7.6167, 142250, true),
('Berrechid', 'Morocco', 'Casablanca-Settat', 33.2653, -7.5875, 136634, true),
('Benslimane', 'Morocco', 'Casablanca-Settat', 33.6167, -7.1333, 57101, true),
('Mediouna', 'Morocco', 'Casablanca-Settat', 33.4500, -7.5167, 35591, true),
('Nouaceur', 'Morocco', 'Casablanca-Settat', 33.3667, -7.5833, 25176, true),
('Bouskoura', 'Morocco', 'Casablanca-Settat', 33.4489, -7.6500, 103026, true),
('Sidi Bennour', 'Morocco', 'Casablanca-Settat', 32.6500, -8.4333, 50280, true),
('Azemmour', 'Morocco', 'Casablanca-Settat', 33.2892, -8.3422, 40920, true)
ON CONFLICT DO NOTHING;

-- Rabat-Salé-Kénitra Region
INSERT INTO public.cities (name, country, region, latitude, longitude, population, is_municipality) VALUES
('Rabat', 'Morocco', 'Rabat-Salé-Kénitra', 34.0209, -6.8416, 577827, true),
('Salé', 'Morocco', 'Rabat-Salé-Kénitra', 34.0531, -6.7986, 890403, true),
('Kénitra', 'Morocco', 'Rabat-Salé-Kénitra', 34.2610, -6.5802, 431282, true),
('Témara', 'Morocco', 'Rabat-Salé-Kénitra', 33.9287, -6.9122, 313510, true),
('Skhirat', 'Morocco', 'Rabat-Salé-Kénitra', 33.8500, -7.0333, 75634, true),
('Sidi Slimane', 'Morocco', 'Rabat-Salé-Kénitra', 34.2667, -5.9167, 96564, true),
('Sidi Kacem', 'Morocco', 'Rabat-Salé-Kénitra', 34.2167, -5.7167, 74062, true),
('Mehdia', 'Morocco', 'Rabat-Salé-Kénitra', 34.2667, -6.6667, 15000, true),
('Ain Aouda', 'Morocco', 'Rabat-Salé-Kénitra', 33.8125, -6.7881, 29744, true),
('Tiflet', 'Morocco', 'Rabat-Salé-Kénitra', 33.8917, -6.3061, 73680, true),
('Khemisset', 'Morocco', 'Rabat-Salé-Kénitra', 33.8236, -6.0661, 131542, true)
ON CONFLICT DO NOTHING;

-- Marrakech-Safi Region
INSERT INTO public.cities (name, country, region, latitude, longitude, population, is_municipality) VALUES
('Marrakech', 'Morocco', 'Marrakech-Safi', 31.6295, -7.9811, 928850, true),
('Safi', 'Morocco', 'Marrakech-Safi', 32.2994, -9.2372, 308508, true),
('Essaouira', 'Morocco', 'Marrakech-Safi', 31.5085, -9.7595, 77966, true),
('El Kelaa des Sraghna', 'Morocco', 'Marrakech-Safi', 32.0500, -7.4000, 78228, true),
('Chichaoua', 'Morocco', 'Marrakech-Safi', 31.5460, -8.7568, 36229, true),
('Youssoufia', 'Morocco', 'Marrakech-Safi', 32.2461, -8.5297, 64518, true),
('Ben Guerir', 'Morocco', 'Marrakech-Safi', 32.2333, -7.9500, 88626, true),
('Tahanaout', 'Morocco', 'Marrakech-Safi', 31.3633, -7.9533, 12000, true),
('Ait Ourir', 'Morocco', 'Marrakech-Safi', 31.5614, -7.6658, 22115, true),
('Tamansourt', 'Morocco', 'Marrakech-Safi', 31.6667, -8.1167, 75000, true)
ON CONFLICT DO NOTHING;

-- Fès-Meknès Region  
INSERT INTO public.cities (name, country, region, latitude, longitude, population, is_municipality) VALUES
('Fès', 'Morocco', 'Fès-Meknès', 34.0181, -5.0078, 1112072, true),
('Meknès', 'Morocco', 'Fès-Meknès', 33.8935, -5.5473, 632079, true),
('Taza', 'Morocco', 'Fès-Meknès', 34.2167, -4.0167, 148456, true),
('Sefrou', 'Morocco', 'Fès-Meknès', 33.8333, -4.8333, 79887, true),
('Moulay Yacoub', 'Morocco', 'Fès-Meknès', 34.0833, -5.1833, 18637, true),
('Ifrane', 'Morocco', 'Fès-Meknès', 33.5228, -5.1108, 14659, true),
('Azrou', 'Morocco', 'Fès-Meknès', 33.4342, -5.2214, 56280, true),
('El Hajeb', 'Morocco', 'Fès-Meknès', 33.6861, -5.3714, 30520, true),
('Boulemane', 'Morocco', 'Fès-Meknès', 33.3625, -4.7306, 5981, true),
('Taounate', 'Morocco', 'Fès-Meknès', 34.5358, -4.6397, 35436, true),
('Missour', 'Morocco', 'Fès-Meknès', 33.0500, -3.9833, 33282, true)
ON CONFLICT DO NOTHING;

-- Tanger-Tétouan-Al Hoceïma Region
INSERT INTO public.cities (name, country, region, latitude, longitude, population, is_municipality) VALUES
('Tanger', 'Morocco', 'Tanger-Tétouan-Al Hoceïma', 35.7595, -5.8340, 947952, true),
('Tétouan', 'Morocco', 'Tanger-Tétouan-Al Hoceïma', 35.5889, -5.3626, 380787, true),
('Al Hoceïma', 'Morocco', 'Tanger-Tétouan-Al Hoceïma', 35.2517, -3.9372, 56716, true),
('Larache', 'Morocco', 'Tanger-Tétouan-Al Hoceïma', 35.1932, -6.1561, 125008, true),
('Chefchaouen', 'Morocco', 'Tanger-Tétouan-Al Hoceïma', 35.1688, -5.2636, 42786, true),
('Asilah', 'Morocco', 'Tanger-Tétouan-Al Hoceïma', 35.4653, -6.0342, 31147, true),
('Fnideq', 'Morocco', 'Tanger-Tétouan-Al Hoceïma', 35.8486, -5.3575, 77586, true),
('M''diq', 'Morocco', 'Tanger-Tétouan-Al Hoceïma', 35.6833, -5.3333, 56227, true),
('Ouezzane', 'Morocco', 'Tanger-Tétouan-Al Hoceïma', 34.7958, -5.5786, 59606, true),
('Ksar El Kebir', 'Morocco', 'Tanger-Tétouan-Al Hoceïma', 35.0000, -5.9000, 126617, true),
('Martil', 'Morocco', 'Tanger-Tétouan-Al Hoceïma', 35.6167, -5.2667, 39011, true)
ON CONFLICT DO NOTHING;

-- Oriental Region
INSERT INTO public.cities (name, country, region, latitude, longitude, population, is_municipality) VALUES
('Oujda', 'Morocco', 'Oriental', 34.6814, -1.9086, 494252, true),
('Nador', 'Morocco', 'Oriental', 35.1681, -2.9286, 161726, true),
('Berkane', 'Morocco', 'Oriental', 34.9200, -2.3200, 109237, true),
('Taourirt', 'Morocco', 'Oriental', 34.4167, -2.8833, 103398, true),
('Jerada', 'Morocco', 'Oriental', 34.3117, -2.1606, 43916, true),
('Figuig', 'Morocco', 'Oriental', 32.1142, -1.2294, 12577, true),
('Bouarfa', 'Morocco', 'Oriental', 32.5333, -1.9667, 25947, true),
('Zaio', 'Morocco', 'Oriental', 35.0167, -2.7333, 35715, true),
('Driouch', 'Morocco', 'Oriental', 34.9833, -3.3833, 26024, true),
('Saïdia', 'Morocco', 'Oriental', 35.0833, -2.2167, 8065, true)
ON CONFLICT DO NOTHING;

-- Béni Mellal-Khénifra Region
INSERT INTO public.cities (name, country, region, latitude, longitude, population, is_municipality) VALUES
('Béni Mellal', 'Morocco', 'Béni Mellal-Khénifra', 32.3372, -6.3498, 192676, true),
('Khénifra', 'Morocco', 'Béni Mellal-Khénifra', 32.9333, -5.6667, 117510, true),
('Fquih Ben Salah', 'Morocco', 'Béni Mellal-Khénifra', 32.5000, -6.6833, 100328, true),
('Khouribga', 'Morocco', 'Béni Mellal-Khénifra', 32.8811, -6.9064, 196196, true),
('Azilal', 'Morocco', 'Béni Mellal-Khénifra', 31.9608, -6.5714, 27683, true),
('Kasba Tadla', 'Morocco', 'Béni Mellal-Khénifra', 32.6000, -6.2667, 47343, true),
('Oued Zem', 'Morocco', 'Béni Mellal-Khénifra', 32.8628, -6.5736, 93989, true),
('Boujniba', 'Morocco', 'Béni Mellal-Khénifra', 32.9167, -6.7667, 18706, true),
('Demnate', 'Morocco', 'Béni Mellal-Khénifra', 31.7333, -7.0000, 28017, true),
('Zaouiat Cheikh', 'Morocco', 'Béni Mellal-Khénifra', 32.6500, -5.9167, 20000, true)
ON CONFLICT DO NOTHING;

-- Drâa-Tafilalet Region
INSERT INTO public.cities (name, country, region, latitude, longitude, population, is_municipality) VALUES
('Errachidia', 'Morocco', 'Drâa-Tafilalet', 31.9314, -4.4297, 92374, true),
('Ouarzazate', 'Morocco', 'Drâa-Tafilalet', 30.9178, -6.8936, 71067, true),
('Tinghir', 'Morocco', 'Drâa-Tafilalet', 31.5147, -5.5322, 42044, true),
('Zagora', 'Morocco', 'Drâa-Tafilalet', 30.3306, -5.8386, 40069, true),
('Midelt', 'Morocco', 'Drâa-Tafilalet', 32.6800, -4.7333, 55304, true),
('Rissani', 'Morocco', 'Drâa-Tafilalet', 31.2833, -4.2667, 24584, true),
('Erfoud', 'Morocco', 'Drâa-Tafilalet', 31.4322, -4.2286, 28763, true),
('Goulmima', 'Morocco', 'Drâa-Tafilalet', 31.6800, -4.9600, 12000, true),
('Merzouga', 'Morocco', 'Drâa-Tafilalet', 31.0819, -4.0136, 3000, true),
('Alnif', 'Morocco', 'Drâa-Tafilalet', 31.1167, -5.1667, 8000, true)
ON CONFLICT DO NOTHING;

-- Souss-Massa Region
INSERT INTO public.cities (name, country, region, latitude, longitude, population, is_municipality) VALUES
('Agadir', 'Morocco', 'Souss-Massa', 30.4278, -9.5981, 421844, true),
('Inezgane', 'Morocco', 'Souss-Massa', 30.3556, -9.5333, 130333, true),
('Taroudant', 'Morocco', 'Souss-Massa', 30.4703, -8.8769, 80149, true),
('Tiznit', 'Morocco', 'Souss-Massa', 29.6974, -9.7316, 74699, true),
('Ait Melloul', 'Morocco', 'Souss-Massa', 30.3347, -9.4975, 171847, true),
('Biougra', 'Morocco', 'Souss-Massa', 30.2167, -9.3667, 22000, true),
('Aoulouz', 'Morocco', 'Souss-Massa', 30.6833, -8.1667, 11000, true),
('Ouled Teima', 'Morocco', 'Souss-Massa', 30.4000, -9.2167, 83983, true),
('Tafraout', 'Morocco', 'Souss-Massa', 29.7333, -8.9667, 7000, true),
('Sidi Ifni', 'Morocco', 'Souss-Massa', 29.3833, -10.1667, 21618, true)
ON CONFLICT DO NOTHING;

-- Guelmim-Oued Noun Region
INSERT INTO public.cities (name, country, region, latitude, longitude, population, is_municipality) VALUES
('Guelmim', 'Morocco', 'Guelmim-Oued Noun', 28.9872, -10.0572, 118318, true),
('Tan-Tan', 'Morocco', 'Guelmim-Oued Noun', 28.4378, -11.1031, 73209, true),
('Assa', 'Morocco', 'Guelmim-Oued Noun', 28.6061, -9.4289, 13000, true),
('Sidi Ifni', 'Morocco', 'Guelmim-Oued Noun', 29.3833, -10.1667, 21618, true)
ON CONFLICT DO NOTHING;

-- Laâyoune-Sakia El Hamra Region
INSERT INTO public.cities (name, country, region, latitude, longitude, population, is_municipality) VALUES
('Laâyoune', 'Morocco', 'Laâyoune-Sakia El Hamra', 27.1253, -13.1625, 217732, true),
('Boujdour', 'Morocco', 'Laâyoune-Sakia El Hamra', 26.1256, -14.4847, 50000, true),
('Es-Semara', 'Morocco', 'Laâyoune-Sakia El Hamra', 26.7414, -11.6717, 57035, true),
('Tarfaya', 'Morocco', 'Laâyoune-Sakia El Hamra', 27.9369, -12.9236, 8000, true)
ON CONFLICT DO NOTHING;

-- Dakhla-Oued Ed-Dahab Region
INSERT INTO public.cities (name, country, region, latitude, longitude, population, is_municipality) VALUES
('Dakhla', 'Morocco', 'Dakhla-Oued Ed-Dahab', 23.7178, -15.9369, 106277, true),
('Aousserd', 'Morocco', 'Dakhla-Oued Ed-Dahab', 22.5500, -14.3333, 1500, true)
ON CONFLICT DO NOTHING;