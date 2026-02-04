import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, MapPin } from "lucide-react";
import { useCreateBin, BinType, BinCapacity } from "@/hooks/useWasteBins";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AddBinDialogProps {
  defaultCityId?: string;
}

const binTypes: { value: BinType; label: string }[] = [
  { value: "mixed", label: "Mixed Waste" },
  { value: "plastic", label: "Plastic" },
  { value: "organic", label: "Organic" },
  { value: "glass", label: "Glass" },
  { value: "paper", label: "Paper" },
  { value: "metal", label: "Metal" },
  { value: "electronic", label: "Electronic" },
];

const capacities: { value: BinCapacity; label: string }[] = [
  { value: "small", label: "Small (50L)" },
  { value: "medium", label: "Medium (120L)" },
  { value: "large", label: "Large (240L)" },
  { value: "extra_large", label: "Extra Large (660L+)" },
];

export const AddBinDialog = ({ defaultCityId }: AddBinDialogProps) => {
  const [open, setOpen] = useState(false);
  const [binCode, setBinCode] = useState("");
  const [cityId, setCityId] = useState(defaultCityId || "");
  const [binType, setBinType] = useState<BinType>("mixed");
  const [capacity, setCapacity] = useState<BinCapacity>("medium");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [street, setStreet] = useState("");
  const [notes, setNotes] = useState("");

  const createBin = useCreateBin();

  const { data: cities } = useQuery({
    queryKey: ['cities-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name, country')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(8));
          setLongitude(position.coords.longitude.toFixed(8));
        },
        (error) => console.error("Error getting location:", error)
      );
    }
  };

  const handleSubmit = async () => {
    if (!binCode || !cityId || !latitude || !longitude) return;

    await createBin.mutateAsync({
      bin_code: binCode,
      city_id: cityId,
      bin_type: binType,
      capacity: capacity,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: address || null,
      district: district || null,
      street: street || null,
      notes: notes || null,
    });

    setOpen(false);
    // Reset form
    setBinCode("");
    setLatitude("");
    setLongitude("");
    setAddress("");
    setDistrict("");
    setStreet("");
    setNotes("");
  };

  // Generate bin code suggestion
  useEffect(() => {
    if (cityId && cities) {
      const city = cities.find(c => c.id === cityId);
      if (city) {
        const prefix = city.name.substring(0, 3).toUpperCase();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        setBinCode(`BIN-${prefix}-${random}`);
      }
    }
  }, [cityId, cities]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Bin
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New Waste Bin</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Bin Code */}
          <div className="space-y-2">
            <Label>Bin Code *</Label>
            <Input
              placeholder="BIN-CAS-0001"
              value={binCode}
              onChange={(e) => setBinCode(e.target.value)}
            />
          </div>

          {/* City Selection */}
          <div className="space-y-2">
            <Label>City *</Label>
            <Select value={cityId} onValueChange={setCityId}>
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {cities?.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}, {city.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Bin Type */}
            <div className="space-y-2">
              <Label>Bin Type</Label>
              <Select value={binType} onValueChange={(v) => setBinType(v as BinType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {binTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Capacity */}
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Select value={capacity} onValueChange={(v) => setCapacity(v as BinCapacity)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {capacities.map((cap) => (
                    <SelectItem key={cap.value} value={cap.value}>
                      {cap.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Location *</Label>
              <Button type="button" variant="ghost" size="sm" onClick={getCurrentLocation}>
                <MapPin className="h-4 w-4 mr-1" />
                Use Current
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                type="number"
                step="any"
              />
              <Input
                placeholder="Longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                type="number"
                step="any"
              />
            </div>
          </div>

          {/* Address Details */}
          <div className="space-y-2">
            <Label>District</Label>
            <Input
              placeholder="e.g., Anfa, Maarif..."
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Street</Label>
            <Input
              placeholder="e.g., Boulevard Mohammed V"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Full Address</Label>
            <Textarea
              placeholder="Complete address description..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button 
            onClick={handleSubmit} 
            disabled={!binCode || !cityId || !latitude || !longitude || createBin.isPending}
            className="w-full"
          >
            {createBin.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registering...
              </>
            ) : (
              "Register Bin"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
