import { useState } from "react";
import { Building2, Plus, Users, MapPin, Mail, Phone, Globe, MoreHorizontal, Eye, Edit, Trash2, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useOrganizations, useCreateOrganization, useUpdateOrganization } from "@/hooks/useAdminApi";
import { OrganizationMembersDialog } from "@/components/admin/OrganizationMembersDialog";
import { OrganizationTerritoriesDialog } from "@/components/admin/OrganizationTerritoriesDialog";

const ORG_TYPES = [
  { value: "municipality", label: "Municipality", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "ngo", label: "NGO", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "government", label: "Government", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { value: "private", label: "Private", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { value: "international", label: "International", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" },
];

const AdminOrganizations = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [territoriesDialogOpen, setTerritoriesDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [newOrg, setNewOrg] = useState({ 
    name: "", 
    type: "ngo", 
    description: "", 
    email: "", 
    phone: "",
    website: "",
    address: ""
  });

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
      setNewOrg({ name: "", type: "ngo", description: "", email: "", phone: "", website: "", address: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!selectedOrg) return;
    try {
      await updateMutation.mutateAsync({
        id: selectedOrg.id,
        data: {
          name: selectedOrg.name,
          type: selectedOrg.type,
          description: selectedOrg.description,
          email: selectedOrg.email,
          phone: selectedOrg.phone,
          website: selectedOrg.website,
          address: selectedOrg.address,
        },
      });
      toast({ title: "Success", description: "Organization updated successfully" });
      setEditDialogOpen(false);
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
    return ORG_TYPES.find((t) => t.value === type)?.color || "bg-gray-100 text-gray-800";
  };

  // Filter organizations
  const filteredOrgs = data?.organizations?.filter((org: any) => {
    const matchesType = typeFilter === "all" || org.type === typeFilter;
    const matchesSearch = !searchQuery || 
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  }) || [];

  // Calculate stats
  const stats = {
    total: data?.pagination?.total || 0,
    active: data?.organizations?.filter((o: any) => o.is_active).length || 0,
    byType: ORG_TYPES.reduce((acc, type) => {
      acc[type.value] = data?.organizations?.filter((o: any) => o.type === type.value).length || 0;
      return acc;
    }, {} as Record<string, number>),
  };

  return (
    <DashboardLayout
      title="Organizations"
      icon={<Building2 className="h-6 w-6 text-primary" />}
      role="admin"
    >
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Organization</DialogTitle>
                <DialogDescription>Add a new organization to the platform</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newOrg.description}
                    onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })}
                    placeholder="Brief description of the organization"
                    rows={3}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input
                      value={newOrg.website}
                      onChange={(e) => setNewOrg({ ...newOrg, website: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={newOrg.address}
                      onChange={(e) => setNewOrg({ ...newOrg, address: e.target.value })}
                      placeholder="123 Main St..."
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {ORG_TYPES.map((type) => (
            <Card 
              key={type.value} 
              className={`cursor-pointer transition-all hover:shadow-md ${typeFilter === type.value ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setTypeFilter(typeFilter === type.value ? "all" : type.value)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <Badge className={type.color + " text-xs"}>{type.label}</Badge>
                  <span className="text-lg font-bold">{stats.byType[type.value]}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Input
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          {typeFilter !== "all" && (
            <Button variant="outline" onClick={() => setTypeFilter("all")}>
              Clear Filter
            </Button>
          )}
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Organizations</CardTitle>
            <CardDescription>
              {filteredOrgs.length} organization{filteredOrgs.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredOrgs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No organizations found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
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
                  {filteredOrgs.map((org: any) => (
                    <TableRow key={org.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{org.name}</p>
                            {org.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-xs">
                                {org.description}
                              </p>
                            )}
                          </div>
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
                              <span className="truncate max-w-32">{org.email}</span>
                            </div>
                          )}
                          {org.phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {org.phone}
                            </div>
                          )}
                          {org.website && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Globe className="h-3 w-3" />
                              <a href={org.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-32">
                                {org.website.replace(/^https?:\/\//, '')}
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setSelectedOrg(org);
                            setMembersDialogOpen(true);
                          }}
                        >
                          <Users className="h-4 w-4" />
                          {org.member_count || 0}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge variant={org.is_active ? "default" : "secondary"}>
                          {org.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedOrg(org);
                              setDetailsDialogOpen(true);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedOrg({...org});
                              setEditDialogOpen(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setSelectedOrg(org);
                              setMembersDialogOpen(true);
                            }}>
                              <Users className="h-4 w-4 mr-2" />
                              Manage Members
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedOrg(org);
                              setTerritoriesDialogOpen(true);
                            }}>
                              <MapPin className="h-4 w-4 mr-2" />
                              Manage Territories
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleToggleActive(org)}
                              className={org.is_active ? "text-destructive" : "text-green-600"}
                            >
                              {org.is_active ? (
                                <>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Building2 className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
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

      {/* Member Management Dialog */}
      <OrganizationMembersDialog
        organization={selectedOrg}
        open={membersDialogOpen}
        onOpenChange={setMembersDialogOpen}
      />

      {/* Territory Management Dialog */}
      <OrganizationTerritoriesDialog
        organization={selectedOrg}
        open={territoriesDialogOpen}
        onOpenChange={setTerritoriesDialogOpen}
      />

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Organization Details
            </DialogTitle>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{selectedOrg.name}</h3>
                <Badge className={getTypeBadgeColor(selectedOrg.type)}>
                  {selectedOrg.type}
                </Badge>
              </div>
              {selectedOrg.description && (
                <p className="text-muted-foreground">{selectedOrg.description}</p>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedOrg.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedOrg.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Website</p>
                  <p className="font-medium">{selectedOrg.website || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Members</p>
                  <p className="font-medium">{selectedOrg.member_count || 0}</p>
                </div>
              </div>
              {selectedOrg.address && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{selectedOrg.address}</p>
                </div>
              )}
              <div className="pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                <span>Created: {new Date(selectedOrg.created_at).toLocaleDateString()}</span>
                <Badge variant={selectedOrg.is_active ? "default" : "secondary"}>
                  {selectedOrg.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={selectedOrg.name}
                    onChange={(e) => setSelectedOrg({ ...selectedOrg, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={selectedOrg.type} onValueChange={(v) => setSelectedOrg({ ...selectedOrg, type: v })}>
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
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={selectedOrg.description || ""}
                  onChange={(e) => setSelectedOrg({ ...selectedOrg, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={selectedOrg.email || ""}
                    onChange={(e) => setSelectedOrg({ ...selectedOrg, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={selectedOrg.phone || ""}
                    onChange={(e) => setSelectedOrg({ ...selectedOrg, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={selectedOrg.website || ""}
                    onChange={(e) => setSelectedOrg({ ...selectedOrg, website: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={selectedOrg.address || ""}
                    onChange={(e) => setSelectedOrg({ ...selectedOrg, address: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleUpdate} className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminOrganizations;
