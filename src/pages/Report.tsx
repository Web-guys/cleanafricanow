import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { z } from 'zod';
import { PhotoUpload } from "@/components/PhotoUpload";

const reportSchema = z.object({
  category: z.enum(['waste', 'pollution', 'danger', 'noise', 'water', 'air', 'illegal_dumping', 'deforestation']),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(1000, "Description too long"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const Report = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Pre-fill from URL params (from map click)
  const urlLat = searchParams.get('lat');
  const urlLng = searchParams.get('lng');
  
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(urlLat || '');
  const [longitude, setLongitude] = useState(urlLng || '');
  const [cityId, setCityId] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Show location pre-filled message if coords came from URL
  const locationPreFilled = urlLat && urlLng;

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(6));
          setLongitude(position.coords.longitude.toFixed(6));
          toast({
            title: t('report.locationDetected.title'),
            description: t('report.locationDetected.message'),
          });
        },
        (error) => {
          toast({
            title: t('report.errors.locationError'),
            description: t('report.errors.locationUnavailable'),
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !description || !latitude || !longitude) {
      toast({
        title: t('report.errors.missingInfo'),
        description: t('report.errors.fillRequired'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate input
      const validated = reportSchema.parse({
        category: category as any,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      });

      const { error } = await supabase
        .from('reports')
        .insert([{
          category: validated.category,
          description: validated.description,
          latitude: validated.latitude,
          longitude: validated.longitude,
          city_id: cityId || null,
          user_id: user?.id,
          photos: photos,
        }]);

      if (error) throw error;

      toast({
        title: t('report.success.title'),
        description: t('report.success.message'),
      });

      navigate('/map');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: t('report.errors.validationError'),
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error('Error submitting report:', error);
        toast({
          title: t('report.errors.submissionFailed'),
          description: t('report.errors.tryAgain'),
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              CleanAfricaNow
            </h1>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>
        </div>
      </header>

      {/* Report Form */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-primary/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">{t('report.title')}</CardTitle>
                <p className="text-muted-foreground">
                  {t('report.subtitle')}
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">{t('report.category')} *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('report.categoryPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="waste">{t('report.categories.waste')}</SelectItem>
                        <SelectItem value="pollution">{t('report.categories.pollution')}</SelectItem>
                        <SelectItem value="danger">{t('report.categories.danger')}</SelectItem>
                        <SelectItem value="noise">{t('report.categories.noise')}</SelectItem>
                        <SelectItem value="water">{t('report.categories.water')}</SelectItem>
                        <SelectItem value="air">{t('report.categories.air')}</SelectItem>
                        <SelectItem value="illegal_dumping">{t('report.categories.illegal_dumping')}</SelectItem>
                        <SelectItem value="deforestation">{t('report.categories.deforestation')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">{t('report.city')}</Label>
                    <Select value={cityId} onValueChange={setCityId}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('report.cityPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {cities?.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{t('report.description')} *</Label>
                    <Textarea
                      id="description"
                      placeholder={t('report.descriptionPlaceholder')}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground">
                      {description.length}/1000 {t('report.characters')}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Label>{t('report.location')} *</Label>
                    {locationPreFilled && (
                      <div className="bg-primary/10 text-primary rounded-lg px-4 py-2 text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {t('report.locationPreFilled', 'Location pre-filled from map selection')}
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={getCurrentLocation}
                      className="w-full"
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      {t('report.useCurrentLocation')}
                    </Button>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="latitude">{t('report.latitude')}</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="0.000001"
                          placeholder="33.5731"
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="longitude">{t('report.longitude')}</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="0.000001"
                          placeholder="-7.5898"
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {user && (
                    <div className="space-y-2">
                      <Label>{t('report.photos')}</Label>
                      <PhotoUpload
                        userId={user.id}
                        onPhotosChange={setPhotos}
                        maxPhotos={5}
                      />
                    </div>
                  )}

                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? t('report.submitting') : t('report.submitReport')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Report;
