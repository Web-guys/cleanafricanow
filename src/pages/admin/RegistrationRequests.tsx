import { useState } from "react";
import { useRegistrationRequests, RegistrationRequest } from "@/hooks/useRegistrationRequests";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, CheckCircle2, XCircle, Clock, FileText, Building2, Users, Briefcase, ExternalLink, Eye } from "lucide-react";
import { format } from "date-fns";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

const RegistrationRequests = () => {
  const { requests, isLoading, approveRequest, isApproving, rejectRequest, isRejecting, setUnderReview } = useRegistrationRequests();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const filteredRequests = requests?.filter((request) => {
    const matchesSearch =
      request.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.contact_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.contact_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && request.status === activeTab;
  });

  const statusCounts = {
    pending: requests?.filter((r) => r.status === "pending").length || 0,
    under_review: requests?.filter((r) => r.status === "under_review").length || 0,
    approved: requests?.filter((r) => r.status === "approved").length || 0,
    rejected: requests?.filter((r) => r.status === "rejected").length || 0,
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { variant: "secondary" as const, icon: Clock, className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
      under_review: { variant: "secondary" as const, icon: FileText, className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      approved: { variant: "secondary" as const, icon: CheckCircle2, className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      rejected: { variant: "secondary" as const, icon: XCircle, className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
    };
    const { icon: Icon, className } = config[status as keyof typeof config] || config.pending;
    return (
      <Badge className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getRoleIcon = (role: string) => {
    const icons = {
      municipality: Building2,
      ngo: Users,
      partner: Briefcase,
    };
    const Icon = icons[role as keyof typeof icons] || Building2;
    return <Icon className="h-4 w-4 text-muted-foreground" />;
  };

  const handleApprove = () => {
    if (selectedRequest) {
      approveRequest({ requestId: selectedRequest.id, adminNotes });
      setSelectedRequest(null);
      setAdminNotes("");
    }
  };

  const handleReject = () => {
    if (selectedRequest && rejectionReason) {
      rejectRequest({ requestId: selectedRequest.id, rejectionReason });
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason("");
    }
  };

  const handleSetUnderReview = () => {
    if (selectedRequest) {
      setUnderReview({ requestId: selectedRequest.id, adminNotes });
    }
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-xl font-semibold">Registration Requests</h1>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("pending")}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold">{statusCounts.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("under_review")}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Under Review</p>
                    <p className="text-2xl font-bold">{statusCounts.under_review}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("approved")}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Approved</p>
                    <p className="text-2xl font-bold">{statusCounts.approved}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("rejected")}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                    <p className="text-2xl font-bold">{statusCounts.rejected}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Registration Requests</CardTitle>
                  <CardDescription>Review and manage institutional registration requests</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
                  <TabsTrigger value="under_review">Under Review ({statusCounts.under_review})</TabsTrigger>
                  <TabsTrigger value="approved">Approved ({statusCounts.approved})</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected ({statusCounts.rejected})</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredRequests?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No requests found
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Organization</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead>Documents</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRequests?.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              <div className="font-medium">{request.organization_name}</div>
                              {request.website && (
                                <a
                                  href={request.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                  Website <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getRoleIcon(request.requested_role)}
                                <span className="capitalize">{request.requested_role}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p>{request.contact_name}</p>
                                <p className="text-muted-foreground">{request.contact_email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {request.city?.name ? `${request.city.name}, ${request.city.country}` : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {request.official_document_url && (
                                  <Badge variant="outline" className="text-xs">Official</Badge>
                                )}
                                {request.id_document_url && (
                                  <Badge variant="outline" className="text-xs">ID</Badge>
                                )}
                                {request.license_document_url && (
                                  <Badge variant="outline" className="text-xs">License</Badge>
                                )}
                                {!request.official_document_url && !request.id_document_url && !request.license_document_url && (
                                  <span className="text-xs text-muted-foreground">None</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(request.created_at), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedRequest(request)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Review Dialog */}
        <Dialog open={!!selectedRequest && !showRejectDialog} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Registration Request</DialogTitle>
              <DialogDescription>
                Review the details and approve or reject this request
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-6">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedRequest.status)}
                  <span className="text-sm text-muted-foreground">
                    Submitted {format(new Date(selectedRequest.created_at), "PPP")}
                  </span>
                </div>

                {/* Organization Details */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Organization</h4>
                    <p className="text-lg font-semibold">{selectedRequest.organization_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getRoleIcon(selectedRequest.requested_role)}
                      <span className="capitalize text-muted-foreground">{selectedRequest.requested_role}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Territory</h4>
                    <p>{selectedRequest.city?.name ? `${selectedRequest.city.name}, ${selectedRequest.city.country}` : "Not specified"}</p>
                    {selectedRequest.address && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedRequest.address}</p>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="font-medium mb-2">Contact Information</h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p>{selectedRequest.contact_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p>{selectedRequest.contact_email}</p>
                    </div>
                    {selectedRequest.contact_phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p>{selectedRequest.contact_phone}</p>
                      </div>
                    )}
                    {selectedRequest.website && (
                      <div>
                        <p className="text-sm text-muted-foreground">Website</p>
                        <a href={selectedRequest.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                          {selectedRequest.website} <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {selectedRequest.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-muted-foreground">{selectedRequest.description}</p>
                  </div>
                )}

                {/* Documents */}
                <div>
                  <h4 className="font-medium mb-2">Verification Documents</h4>
                  <div className="grid gap-2 md:grid-cols-3">
                    {selectedRequest.official_document_url ? (
                      <a
                        href={selectedRequest.official_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                      >
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm">Official Registration</span>
                      </a>
                    ) : (
                      <div className="p-3 border rounded-lg border-dashed text-muted-foreground text-sm">
                        No official document
                      </div>
                    )}
                    {selectedRequest.id_document_url ? (
                      <a
                        href={selectedRequest.id_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                      >
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm">ID Document</span>
                      </a>
                    ) : (
                      <div className="p-3 border rounded-lg border-dashed text-muted-foreground text-sm">
                        No ID document
                      </div>
                    )}
                    {selectedRequest.license_document_url ? (
                      <a
                        href={selectedRequest.license_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                      >
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm">Operating License</span>
                      </a>
                    ) : (
                      <div className="p-3 border rounded-lg border-dashed text-muted-foreground text-sm">
                        No license document
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Notes */}
                {selectedRequest.status === "pending" || selectedRequest.status === "under_review" ? (
                  <div>
                    <h4 className="font-medium mb-2">Admin Notes</h4>
                    <Textarea
                      placeholder="Add internal notes about this request..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                ) : selectedRequest.admin_notes ? (
                  <div>
                    <h4 className="font-medium mb-2">Admin Notes</h4>
                    <p className="text-muted-foreground">{selectedRequest.admin_notes}</p>
                  </div>
                ) : null}

                {/* Rejection Reason */}
                {selectedRequest.status === "rejected" && selectedRequest.rejection_reason && (
                  <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">Rejection Reason</h4>
                    <p className="text-red-700 dark:text-red-300">{selectedRequest.rejection_reason}</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2">
              {selectedRequest?.status === "pending" && (
                <Button
                  variant="outline"
                  onClick={handleSetUnderReview}
                >
                  Mark Under Review
                </Button>
              )}
              {(selectedRequest?.status === "pending" || selectedRequest?.status === "under_review") && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectDialog(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={isApproving}
                  >
                    {isApproving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Registration Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this request. This will be visible to the applicant.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason || isRejecting}
              >
                {isRejecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default RegistrationRequests;
