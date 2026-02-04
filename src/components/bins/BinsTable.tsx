import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Search, MapPin, CheckCircle, MoreHorizontal } from "lucide-react";
import { useBins, WasteBin, BinStatus, useLogCollection } from "@/hooks/useWasteBins";
import { BinStatusBadge } from "./BinStatusBadge";
import { ReportBinStatusDialog } from "./ReportBinStatusDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BinsTableProps {
  cityId?: string;
}

const binTypeLabels: Record<string, string> = {
  mixed: "Mixed",
  plastic: "Plastic",
  organic: "Organic",
  glass: "Glass",
  paper: "Paper",
  metal: "Metal",
  electronic: "E-Waste",
};

export const BinsTable = ({ cityId }: BinsTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BinStatus | "all">("all");
  
  const { data: bins, isLoading } = useBins(cityId);
  const logCollection = useLogCollection();

  const filteredBins = bins?.filter((bin) => {
    const matchesSearch = 
      bin.bin_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bin.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bin.street?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || bin.current_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleMarkCollected = (bin: WasteBin) => {
    logCollection.mutate({
      bin_id: bin.id,
      status_before: bin.current_status,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Waste Bins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Waste Bins
          <Badge variant="secondary" className="ml-2">
            {filteredBins?.length || 0}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by code, district, street..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BinStatus | "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="empty">Empty</SelectItem>
              <SelectItem value="half_full">Half Full</SelectItem>
              <SelectItem value="almost_full">Almost Full</SelectItem>
              <SelectItem value="full">Full</SelectItem>
              <SelectItem value="overflowing">Overflowing</SelectItem>
              <SelectItem value="damaged">Damaged</SelectItem>
              <SelectItem value="missing">Missing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBins?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No bins found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBins?.map((bin) => (
                  <TableRow key={bin.id}>
                    <TableCell className="font-medium">{bin.bin_code}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{binTypeLabels[bin.bin_type]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {bin.district || bin.street || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <BinStatusBadge status={bin.current_status} size="sm" />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {bin.last_status_update_at 
                        ? formatDistanceToNow(new Date(bin.last_status_update_at), { addSuffix: true })
                        : "—"
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <ReportBinStatusDialog 
                            bin={bin} 
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                Report Status
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuItem 
                            onClick={() => handleMarkCollected(bin)}
                            disabled={bin.current_status === 'empty'}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Collected
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
