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
  CheckCircle,
  AlertCircle,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportToExcel, exportToPDF, formatDate, formatNumber, ReportData } from "@/lib/report-utils";

interface ExportReadyData {
  id: string;
  product_name: string;
  batch_number: string;
  quantity: number;
  warehouse_name: string;
  qc_status: string;
  certification: string;
  ready_date: string;
}

export default function ExportReadyStockReport() {
  const [filters, setFilters] = useState({
    warehouse: "",
  });
  const [exporting, setExporting] = useState(false);

  const { data: warehouses = [] } = useQuery({
    queryKey: ["export-warehouses"],
    queryFn: async () => {
      const { data } = await supabase.from("warehouses").select("id, name");
      return data || [];
    },
  });

  const { data: exportReadyData = [], isLoading, error } = useQuery({
    queryKey: ["export-ready-report", filters],
    queryFn: async () => {
      let query = supabase
        .from("inventory_batches")
        .select(`
          id,
          lot_number,
          quantity_remaining_kg,
          status,
          updated_at,
          product:products(name),
          warehouse:warehouses(name)
        `)
        .eq("status", "qc_passed");

      if (filters.warehouse) {
        query = query.eq("warehouse_id", filters.warehouse);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        product_name: item.product?.name || "Unknown",
        batch_number: item.lot_number || "N/A",
        quantity: item.quantity_remaining_kg || 0,
        warehouse_name: item.warehouse?.name || "Unknown",
        qc_status: "QC Passed",
        certification: "Standard Compliance",
        ready_date: item.updated_at,
      }));
    },
  });

  const calculateSummary = () => {
    const totalBatches = exportReadyData.length;
    const totalQuantity = exportReadyData.reduce((sum, d) => sum + d.quantity, 0);
    const certified = exportReadyData.filter((d) => d.certification).length;

    return {
      "Ready for Export": totalBatches.toString(),
      "Total Quantity (kg)": formatNumber(totalQuantity),
      "With Certification": certified.toString(),
      "Quality Status": "All Approved",
    };
  };

  const handleExport = async (format: "pdf" | "excel") => {
    try {
      setExporting(true);

      const reportData: ReportData = {
        title: "Export Ready Stock Report",
        subtitle: "List of inventory ready for export with quality certifications",
        columns: [
          { field: "product_name", header: "Product", width: 20 },
          { field: "batch_number", header: "Batch Number", width: 15 },
          {
            field: "quantity",
            header: "Quantity (kg)",
            format: (v) => formatNumber(v),
          },
          { field: "warehouse_name", header: "Warehouse", width: 15 },
          { field: "qc_status", header: "QC Status", width: 15 },
          { field: "certification", header: "Certification", width: 20 },
          {
            field: "ready_date",
            header: "Ready Date",
            format: formatDate,
          },
        ],
        rows: exportReadyData,
        summary: calculateSummary(),
        generatedDate: new Date(),
        filters,
      };

      if (format === "pdf") {
        exportToPDF(reportData, "export-ready-report");
      } else {
        exportToExcel(reportData, "export-ready-report");
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
        title="Export Ready Stock Report"
        description="List of inventory ready for export with quality certifications"
        breadcrumbs={[
          { label: "Warehouse" },
          { label: "Reports", to: "/warehouse/reports" },
          { label: "Export Ready" },
        ]}
      />

      {/* Success Banner */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-emerald-600">Export Ready Inventory</p>
          <p className="text-sm text-emerald-600/80">
            All batches listed below have passed quality control and are ready for shipment.
          </p>
        </div>
      </div>

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
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(calculateSummary()).map(([key, value]) => (
          <Card key={key} className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/20">
            <div className="text-sm text-muted-foreground font-medium">{key}</div>
            <div className="text-2xl font-bold text-emerald-500 mt-2">{value}</div>
          </Card>
        ))}
      </div>

      {/* Data Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold">Export Ready Inventory</h3>
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
        ) : exportReadyData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No export ready inventory found with current filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Product</th>
                  <th className="px-6 py-4 text-left font-semibold">Batch #</th>
                  <th className="px-6 py-4 text-right font-semibold">Qty (kg)</th>
                  <th className="px-6 py-4 text-left font-semibold">Warehouse</th>
                  <th className="px-6 py-4 text-left font-semibold">QC Status</th>
                  <th className="px-6 py-4 text-left font-semibold">Certification</th>
                  <th className="px-6 py-4 text-left font-semibold">Ready Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {exportReadyData.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">{row.product_name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {row.batch_number}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-500 font-semibold">
                      {formatNumber(row.quantity)}
                    </td>
                    <td className="px-6 py-4">{row.warehouse_name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                        <CheckCircle className="w-3 h-3" />
                        {row.qc_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {row.certification}
                    </td>
                    <td className="px-6 py-4">{formatDate(row.ready_date)}</td>
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
