import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRegistrationRequests, RequestedRole } from "@/hooks/useRegistrationRequests";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Upload, Building2, Users, Briefcase, CheckCircle2, Clock, XCircle, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

const registrationSchema = z.object({
  requested_role: z.enum(["municipality", "ngo", "partner"]),
  organization_name: z.string().min(2, "Organization name is required").max(200),
  organization_type: z.string().optional(),
  contact_name: z.string().min(2, "Contact name is required").max(100),
  contact_email: z.string().email("Valid email is required"),
  contact_phone: z.string().optional(),
  city_id: z.string().optional(),
  region: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().max(1000).optional(),
});

type FormData = z.infer<typeof registrationSchema>;

const InstitutionalRegistrationForm = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { userRequest, isLoadingUserRequest, createRequest, isCreating } = useRegistrationRequests();
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [documentUrls, setDocumentUrls] = useState<{
    official?: string;
    id?: string;
    license?: string;
  }>({});

  const { data: cities } = useQuery({
    queryKey: ["cities-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("id, name, country, region")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      requested_role: "municipality",
      organization_name: "",
      contact_name: "",
      contact_email: user?.email || "",
      contact_phone: "",
      city_id: "",
      region: "",
      address: "",
      website: "",
      description: "",
    },
  });

  const handleDocumentUpload = async (file: File, docType: "official" | "id" | "license") => {
    if (!user?.id || !file) return;

    setUploadingDoc(docType);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${docType}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("registration-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("registration-documents")
        .getPublicUrl(fileName);

      setDocumentUrls(prev => ({
        ...prev,
        [docType]: publicUrl,
      }));
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploadingDoc(null);
    }
  };

  const onSubmit = (data: FormData) => {
    // Map requested_role to organization_type
    const orgTypeMap: Record<string, "municipality" | "ngo" | "private"> = {
      municipality: "municipality",
      ngo: "ngo",
      partner: "private",
    };
    
    createRequest({
      requested_role: data.requested_role,
      organization_name: data.organization_name,
      organization_type: orgTypeMap[data.requested_role],
      contact_name: data.contact_name,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      city_id: data.city_id,
      region: data.region,
      address: data.address,
      website: data.website || undefined,
      description: data.description,
      official_document_url: documentUrls.official,
      id_document_url: documentUrls.id,
      license_document_url: documentUrls.license,
    });
  };

  const roleIcons = {
    municipality: Building2,
    ngo: Users,
    partner: Briefcase,
  };

  const roleDescriptions = {
    municipality: "Government entity responsible for city waste management and public services",
    ngo: "Non-governmental organization focused on environmental protection and community engagement",
    partner: "Private company providing waste collection, recycling, or related services",
  };

  // Show existing request status
  if (isLoadingUserRequest) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (userRequest) {
    const statusConfig = {
      pending: { icon: Clock, color: "bg-amber-500", text: "Pending Review" },
      under_review: { icon: FileText, color: "bg-blue-500", text: "Under Review" },
      approved: { icon: CheckCircle2, color: "bg-green-500", text: "Approved" },
      rejected: { icon: XCircle, color: "bg-red-500", text: "Rejected" },
    };

    const status = statusConfig[userRequest.status];
    const StatusIcon = status.icon;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            Registration Request Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className={status.color}>{status.text}</Badge>
            <span className="text-sm text-muted-foreground">
              Submitted on {new Date(userRequest.created_at).toLocaleDateString()}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Organization</p>
              <p className="text-muted-foreground">{userRequest.organization_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Requested Role</p>
              <p className="text-muted-foreground capitalize">{userRequest.requested_role}</p>
            </div>
            {userRequest.city && (
              <div>
                <p className="text-sm font-medium">City</p>
                <p className="text-muted-foreground">{userRequest.city.name}, {userRequest.city.country}</p>
              </div>
            )}
          </div>

          {userRequest.status === "rejected" && userRequest.rejection_reason && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Request Rejected</AlertTitle>
              <AlertDescription>{userRequest.rejection_reason}</AlertDescription>
            </Alert>
          )}

          {userRequest.status === "approved" && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Congratulations!</AlertTitle>
              <AlertDescription>
                Your request has been approved. You now have {userRequest.requested_role} access.
                Please log out and log back in to access your new dashboard.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Institutional Registration Request</CardTitle>
        <CardDescription>
          Request access as a municipality, NGO, or partner company. Your request will be reviewed by administrators.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Role Selection */}
            <FormField
              control={form.control}
              name="requested_role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Type *</FormLabel>
                  <div className="grid gap-3 md:grid-cols-3">
                    {(["municipality", "ngo", "partner"] as RequestedRole[]).map((role) => {
                      const Icon = roleIcons[role];
                      const isSelected = field.value === role;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => field.onChange(role)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <Icon className={`h-6 w-6 mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          <p className="font-medium capitalize">{role}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {roleDescriptions[role]}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Organization Details */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="organization_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mohammedia Municipality" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City / Territory</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cities?.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name}, {city.country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>The city you will manage or operate in</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person *</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="official@organization.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+212 5XX XXX XXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.organization.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Street address, city, postal code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of your organization and its role in waste management..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Document Uploads */}
            <div className="space-y-4">
              <h4 className="font-medium">Verification Documents</h4>
              <p className="text-sm text-muted-foreground">
                Upload official documents to verify your organization (PDF, JPG, PNG - max 5MB each)
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                {/* Official Document */}
                <div className="border rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Official Registration</p>
                  <p className="text-xs text-muted-foreground mb-3">Business license or registration certificate</p>
                  {documentUrls.official ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm">Uploaded</span>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 text-primary hover:underline">
                        {uploadingDoc === "official" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        <span className="text-sm">Upload document</span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleDocumentUpload(file, "official");
                        }}
                        disabled={uploadingDoc !== null}
                      />
                    </label>
                  )}
                </div>

                {/* ID Document */}
                <div className="border rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">ID Document</p>
                  <p className="text-xs text-muted-foreground mb-3">Contact person's national ID or passport</p>
                  {documentUrls.id ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm">Uploaded</span>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 text-primary hover:underline">
                        {uploadingDoc === "id" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        <span className="text-sm">Upload document</span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleDocumentUpload(file, "id");
                        }}
                        disabled={uploadingDoc !== null}
                      />
                    </label>
                  )}
                </div>

                {/* License Document */}
                <div className="border rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Operating License</p>
                  <p className="text-xs text-muted-foreground mb-3">Permit to operate in waste management</p>
                  {documentUrls.license ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm">Uploaded</span>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 text-primary hover:underline">
                        {uploadingDoc === "license" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        <span className="text-sm">Upload document</span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleDocumentUpload(file, "license");
                        }}
                        disabled={uploadingDoc !== null}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Registration Request"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default InstitutionalRegistrationForm;
