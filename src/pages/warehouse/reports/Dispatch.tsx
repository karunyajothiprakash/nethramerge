import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import Card from "@/components/Card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Filter,
  Loader2,
  Truck,
  AlertCircle,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportToExcel, exportToPDF, formatDate, formatNumber, ReportData } from "@/lib/report-utils";

interface DispatchData {
  id: string;
  reference_number: string;
  destination: string;
  dispatch_date: string;
  status: string;
  quantity: number;
  container_count: number;
}

export default function DispatchReport() {
  const [filters, setFilters] = useState({
    status: "",
  });
  const [exporting, setExporting] = useState(false);

  const { data: dispatchData = [], isLoading, error } = useQuery({
    queryKey: ["dispatch-report", filters],
    queryFn: async () => {
      let query = supabase
        .from("export_shipments")
        .select(`
          id,
          reference_number,
          destination,
          dispatch_date,
          status,
          net_weight,
          container_count
        `)
        .order("dispatch_date", { ascending: false });

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        reference_number: item.reference_number || "N/A",
        destination: item.destination || "Unknown",
        dispatch_date: item.dispatch_date,
        status: item.status || "pending",
        quantity: item.net_weight || 0,
        container_count: item.container_count || 0,
      }));
    },
  });

  const calculateSummary = () => {
    const dispatched = dispatchData.filter((d) => d.status === "dispatched").length;
    const inTransit = dispatchData.filter((d) => d.status === "in_transit").length;

    return {
      "Total Shipments": dispatchData.length.toString(),
      "Dispatched": dispatched.toString(),
      "In Transit": inTransit.toString(),
      "Total Weight (kg)": formatNumber(
        dispatchData.reduce((sum, d) => sum + d.quantity, 0)
      ),
    };
  };

  const handleExport = async (format: "pdf" | "excel") => {
    try {
      setExporting(true);

      const reportData: ReportData = {
        title: "Dispatch Report",
        subtitle: "Monitor shipments, dispatch status, and delivery tracking",
        columns: [
          { field: "reference_number", header: "Reference #", width: 15 },
          { field: "destination", header: "Destination", width: 25 },
          { field: "dispatch_date", header: "Dispatch Date", format: formatDate },
          {
            field: "quantity",
            header: "Weight (kg)",
            format: (v) => formatNumber(v),
          },
          { field: "container_count", header: "Containers", width: 12 },
          {
            field: "status",
            header: "Status",
            format: (v) => v.replace(/_/g, " ").toUpperCase(),
          },
        ],
        rows: dispatchData,
        summary: calculateSummary(),
        generatedDate: new Date(),
        filters,
      };

      if (format === "pdf") {
        exportToPDF(reportData, "dispatch-report");
      } else {
        exportToExcel(reportData, "dispatch-report");
      }

      toast.success(`Exported to ${format.toUpperCase()} successfully!`);
    } catch (err) {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Dispatch Report"
        description="Monitor shipments, dispatch status, and delivery tracking"
        breadcrumbs={[
          { label: "Warehouse" },
          { label: "Reports", to: "/warehouse/reports" },
          { label: "Dispatch" },
        ]}
      />

      {/* Filters */}
      <Card className="bg-muted/30">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(v) => setFilters({ ...filters, status: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="dispatched">Dispatched</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(calculateSummary()).map(([key, value]) => (
          <Card key={key} className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-cyan-500/20">
            <div className="text-sm text-muted-foreground font-medium">{key}</div>
            <div className="text-2xl font-bold text-cyan-500 mt-2">{value}</div>
          </Card>
        ))}
      </div>

      {/* Data Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Shipment Details</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("excel")}
              disabled={isLoading || exporting}
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
              disabled={isLoading || exporting}
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              PDF
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-600">Error loading report</p>
              <p className="text-sm text-red-600/80">Please try again</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : dispatchData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No dispatch data found with current filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Reference</th>
                  <th className="px-6 py-4 text-left font-semibold">Destination</th>
                  <th className="px-6 py-4 text-left font-semibold">Dispatch Date</th>
                  <th className="px-6 py-4 text-right font-semibold">Weight (kg)</th>
                  <th className="px-6 py-4 text-center font-semibold">Containers</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dispatchData.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{row.reference_number}</td>
                    <td className="px-6 py-4">{row.destination}</td>
                    <td className="px-6 py-4">{formatDate(row.dispatch_date)}</td>
                    <td className="px-6 py-4 text-right font-mono">
                      {formatNumber(row.quantity)}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold">{row.container_count}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                        {row.status.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
