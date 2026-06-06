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
  Package,
  AlertCircle,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportToExcel, exportToPDF, formatDate, formatNumber, ReportData } from "@/lib/report-utils";

interface BatchData {
  id: string;
  lot_number: string;
  product_name: string;
  warehouse_name: string;
  quantity_kg: number;
  quantity_remaining_kg: number;
  received_date: string;
  status: string;
}

export default function BatchTrackingReport() {
  const [filters, setFilters] = useState({
    warehouse: "",
    status: "",
  });
  const [exporting, setExporting] = useState(false);

  const { data: warehouses = [] } = useQuery({
    queryKey: ["batch-warehouses"],
    queryFn: async () => {
      const { data } = await supabase.from("warehouses").select("id, name");
      return data || [];
    },
  });

  const { data: batchData = [], isLoading, error } = useQuery({
    queryKey: ["batch-tracking-report", filters],
    queryFn: async () => {
      let query = supabase
        .from("inventory_batches")
        .select(
          `
          id,
          lot_number,
          quantity_kg,
          quantity_remaining_kg,
          received_date,
          status,
          product:products(name),
          warehouse:warehouses(name)
        `
        )
        .order("received_date", { ascending: false });

      if (filters.warehouse) {
        query = query.eq("warehouse_id", filters.warehouse);
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((batch: any) => ({
        id: batch.id,
        lot_number: batch.lot_number || "N/A",
        product_name: batch.product?.name || "Unknown",
        warehouse_name: batch.warehouse?.name || "Unknown",
        quantity_kg: batch.quantity_kg || 0,
        quantity_remaining_kg: batch.quantity_remaining_kg || 0,
        received_date: batch.received_date,
        status: batch.status,
      }));
    },
  });

  const calculateSummary = () => {
    const totalBatches = batchData.length;
    const totalQuantity = batchData.reduce((sum, b) => sum + b.quantity_kg, 0);
    const movedQuantity = batchData.reduce(
      (sum, b) => sum + (b.quantity_kg - b.quantity_remaining_kg),
      0
    );

    return {
      "Total Batches": totalBatches.toString(),
      "Total Received (kg)": formatNumber(totalQuantity),
      "Quantity Moved (kg)": formatNumber(movedQuantity),
      "Current Stock (kg)": formatNumber(
        batchData.reduce((sum, b) => sum + b.quantity_remaining_kg, 0)
      ),
    };
  };

  const handleExport = async (format: "pdf" | "excel") => {
    try {
      setExporting(true);

      const reportData: ReportData = {
        title: "Batch Tracking Report",
        subtitle: "Track inventory movements and batch-wise stock availability",
        columns: [
          { field: "lot_number", header: "Lot Number", width: 15 },
          { field: "product_name", header: "Product", width: 20 },
          { field: "warehouse_name", header: "Warehouse", width: 20 },
          {
            field: "quantity_kg",
            header: "Received (kg)",
            format: (v) => formatNumber(v),
          },
          {
            field: "quantity_remaining_kg",
            header: "Current (kg)",
            format: (v) => formatNumber(v),
          },
          {
            field: "received_date",
            header: "Receipt Date",
            format: formatDate,
          },
          {
            field: "status",
            header: "Status",
            format: (v) => v.replace(/_/g, " ").toUpperCase(),
          },
        ],
        rows: batchData,
        summary: calculateSummary(),
        generatedDate: new Date(),
        filters,
      };

      if (format === "pdf") {
        exportToPDF(reportData, "batch-tracking-report");
      } else {
        exportToExcel(reportData, "batch-tracking-report");
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
        title="Batch Tracking Report"
        description="Track inventory movements and batch-wise stock availability"
        breadcrumbs={[
          { label: "Warehouse" },
          { label: "Reports", to: "/warehouse/reports" },
          { label: "Batch Tracking" },
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
              <Label>Warehouse</Label>
              <Select
                value={filters.warehouse}
                onValueChange={(v) =>
                  setFilters({ ...filters, warehouse: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Warehouses</SelectItem>
                  {warehouses.map((w: any) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                  <SelectItem value="pending_qc">Pending QC</SelectItem>
                  <SelectItem value="qc_passed">QC Passed</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="consumed">Consumed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(calculateSummary()).map(([key, value]) => (
          <Card key={key} className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
            <div className="text-sm text-muted-foreground font-medium">{key}</div>
            <div className="text-2xl font-bold text-purple-500 mt-2">{value}</div>
          </Card>
        ))}
      </div>

      {/* Data Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Batch Details</h3>
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
        ) : batchData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No batch data found with current filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Lot Number</th>
                  <th className="px-6 py-4 text-left font-semibold">Product</th>
                  <th className="px-6 py-4 text-left font-semibold">Warehouse</th>
                  <th className="px-6 py-4 text-right font-semibold">Received (kg)</th>
                  <th className="px-6 py-4 text-right font-semibold">Current (kg)</th>
                  <th className="px-6 py-4 text-left font-semibold">Receipt Date</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {batchData.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {row.lot_number}
                    </td>
                    <td className="px-6 py-4">{row.product_name}</td>
                    <td className="px-6 py-4">{row.warehouse_name}</td>
                    <td className="px-6 py-4 text-right font-mono">
                      {formatNumber(row.quantity_kg)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-500 font-semibold">
                      {formatNumber(row.quantity_remaining_kg)}
                    </td>
                    <td className="px-6 py-4">{formatDate(row.received_date)}</td>
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
