import { useState } from "react";
import { Building2, Plus, Users, MapPin, Mail, Phone, Globe, MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useOrganizations, useCreateOrganization, useUpdateOrganization } from "@/hooks/useAdminApi";

const ORG_TYPES = [
  { value: "municipality", label: "Municipality" },
  { value: "ngo", label: "NGO" },
  { value: "government", label: "Government" },
  { value: "private", label: "Private" },
  { value: "international", label: "International" },
];

const AdminOrganizations = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", type: "ngo", description: "", email: "", phone: "" });

  const { data, isLoading } = useOrganizations(page);
  const createMutation = useCreateOrganization();
  const updateMutation = useUpdateOrganization();

  const handleCreate = async () => {
    if (!newOrg.name || !newOrg.type) {
      toast({ title: "Error", description: "Name and type are required", variant: "destructive" });
      return;
    }

    try {
      await createMutation.mutateAsync(newOrg);
      toast({ title: "Success", description: "Organization created successfully" });
      setIsCreateOpen(false);
      setNewOrg({ name: "", type: "ngo", description: "", email: "", phone: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleActive = async (org: any) => {
    try {
      await updateMutation.mutateAsync({
        id: org.id,
        data: { is_active: !org.is_active },
      });
      toast({ title: "Success", description: `Organization ${org.is_active ? "deactivated" : "activated"}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      municipality: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      ngo: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      government: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      private: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      international: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <DashboardLayout
      title="Organizations"
      icon={<Building2 className="h-6 w-6 text-primary" />}
      role="admin"
    >
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              Manage municipalities, NGOs, and partner organizations
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Organization
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Organization</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={newOrg.name}
                    onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                    placeholder="Organization name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select value={newOrg.type} onValueChange={(v) => setNewOrg({ ...newOrg, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORG_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newOrg.description}
                    onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })}
                    placeholder="Brief description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newOrg.email}
                      onChange={(e) => setNewOrg({ ...newOrg, email: e.target.value })}
                      placeholder="contact@org.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={newOrg.phone}
                      onChange={(e) => setNewOrg({ ...newOrg, phone: e.target.value })}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Organization"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data?.pagination?.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Organizations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {ORG_TYPES.slice(0, 3).map((type) => (
            <Card key={type.value}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Badge className={getTypeBadgeColor(type.value)}>{type.label}</Badge>
                  <p className="text-lg font-semibold">
                    {data?.organizations?.filter((o: any) => o.type === type.value).length || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.organizations?.map((org: any) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{org.name}</p>
                          {org.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {org.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeBadgeColor(org.type)}>
                          {org.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {org.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {org.email}
                            </div>
                          )}
                          {org.phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {org.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {org.member_count || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={org.is_active ? "default" : "secondary"}>
                          {org.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Manage Members</DropdownMenuItem>
                            <DropdownMenuItem>Manage Territories</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(org)}>
                              {org.is_active ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {data?.pagination && data.pagination.total_pages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="py-2 px-4 text-sm">
                  Page {page} of {data.pagination.total_pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= data.pagination.total_pages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminOrganizations;
