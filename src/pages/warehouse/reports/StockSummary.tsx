import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import Card from "@/components/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Download,
  Filter,
  Loader2,
  Package,
  AlertCircle,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportToExcel, exportToPDF, formatNumber, ReportData } from "@/lib/report-utils";

interface StockData {
  product_id: string;
  product_name: string;
  warehouse_id: string;
  warehouse_name: string;
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  status: string;
  grade?: string;
}

export default function StockSummaryReport() {
  const [filters, setFilters] = useState({
    warehouse: "",
    status: "",
    product: "",
  });
  const [exporting, setExporting] = useState(false);

  const { data: warehouses = [] } = useQuery({
    queryKey: ["report-warehouses"],
    queryFn: async () => {
      const { data } = await supabase.from("warehouses").select("id, name");
      return data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["report-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name");
      return data || [];
    },
  });

  const { data: stockData = [], isLoading, error } = useQuery({
    queryKey: ["stock-summary-report", filters],
    queryFn: async () => {
      let query = supabase
        .from("inventory_batches")
        .select(
          `
          id,
          quantity_kg,
          quantity_remaining_kg,
          status,
          product:products(id, name),
          warehouse:warehouses(id, name)
        `
        );

      if (filters.warehouse) {
        query = query.eq("warehouse_id", filters.warehouse);
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.product) {
        query = query.eq("product_id", filters.product);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group and aggregate data
      const grouped: Record<string, StockData> = {};
      (data || []).forEach((batch: any) => {
        const key = `${batch.product?.id}-${batch.warehouse?.id}`;
        if (!grouped[key]) {
          grouped[key] = {
            product_id: batch.product?.id || "unknown",
            product_name: batch.product?.name || "Unknown Product",
            warehouse_id: batch.warehouse?.id || "unknown",
            warehouse_name: batch.warehouse?.name || "Unknown Warehouse",
            total_quantity: 0,
            reserved_quantity: 0,
            available_quantity: 0,
            status: batch.status || "unknown",
          };
        }
        grouped[key].total_quantity += batch.quantity_kg || 0;
        grouped[key].available_quantity += batch.quantity_remaining_kg || 0;
      });

      return Object.values(grouped);
    },
  });

  const calculateSummary = () => {
    return {
      "Total Stock (kg)": formatNumber(
        stockData.reduce((sum, item) => sum + item.total_quantity, 0)
      ),
      "Available Stock (kg)": formatNumber(
        stockData.reduce((sum, item) => sum + item.available_quantity, 0)
      ),
      "Reserved Stock (kg)": formatNumber(
        stockData.reduce(
          (sum, item) => sum + (item.total_quantity - item.available_quantity),
          0
        )
      ),
      "Total Records": stockData.length.toString(),
    };
  };

  const handleExport = async (format: "pdf" | "excel") => {
    try {
      setExporting(true);

      const reportData: ReportData = {
        title: "Stock Summary Report",
        subtitle: "Current inventory levels across warehouses",
        columns: [
          { field: "product_name", header: "Product", width: 20 },
          { field: "warehouse_name", header: "Warehouse", width: 20 },
          {
            field: "total_quantity",
            header: "Total Stock (kg)",
            format: (v) => formatNumber(v),
          },
          {
            field: "available_quantity",
            header: "Available (kg)",
            format: (v) => formatNumber(v),
          },
          {
            field: "status",
            header: "Status",
            format: (v) => v.replace(/_/g, " ").toUpperCase(),
          },
        ],
        rows: stockData,
        summary: calculateSummary(),
        generatedDate: new Date(),
        filters,
      };

      if (format === "pdf") {
        exportToPDF(reportData, "stock-summary-report");
      } else {
        exportToExcel(reportData, "stock-summary-report");
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
        title="Stock Summary Report"
        description="Overview of current inventory levels across all warehouses and products"
        breadcrumbs={[
          { label: "Warehouse" },
          { label: "Reports", to: "/warehouse/reports" },
          { label: "Stock Summary" },
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
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Product</Label>
              <Select
                value={filters.product}
                onValueChange={(v) =>
                  setFilters({ ...filters, product: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Products</SelectItem>
                  {products.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
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
          <Card key={key} className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <div className="text-sm text-muted-foreground font-medium">{key}</div>
            <div className="text-2xl font-bold text-blue-500 mt-2">{value}</div>
          </Card>
        ))}
      </div>

      {/* Data Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Stock Details</h3>
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
        ) : stockData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No stock data found with current filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Product</th>
                  <th className="px-6 py-4 text-left font-semibold">Warehouse</th>
                  <th className="px-6 py-4 text-right font-semibold">Total (kg)</th>
                  <th className="px-6 py-4 text-right font-semibold">Available (kg)</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stockData.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">{row.product_name}</td>
                    <td className="px-6 py-4">{row.warehouse_name}</td>
                    <td className="px-6 py-4 text-right font-mono">
                      {formatNumber(row.total_quantity)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      {formatNumber(row.available_quantity)}
                    </td>
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
