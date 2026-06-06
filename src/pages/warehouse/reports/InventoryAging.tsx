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
  Calendar,
  AlertCircle,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportToExcel, exportToPDF, formatDate, formatNumber, ReportData } from "@/lib/report-utils";
import { differenceInDays } from "date-fns";

interface AgingData {
  id: string;
  product_name: string;
  batch_number: string;
  received_date: string;
  days_in_stock: number;
  quantity: number;
  warehouse_name: string;
  status: string;
  aging_category: string;
}

export default function InventoryAgingReport() {
  const [filters, setFilters] = useState({
    aging_category: "",
  });
  const [exporting, setExporting] = useState(false);

  const { data: agingData = [], isLoading, error } = useQuery({
    queryKey: ["inventory-aging-report", filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_batches")
        .select(`
          id,
          lot_number,
          quantity_remaining_kg,
          received_date,
          status,
          product:products(name),
          warehouse:warehouses(name)
        `)
        .order("received_date", { ascending: true });

      if (error) throw error;

      const processedData = (data || [])
        .map((item: any) => {
          const daysInStock = differenceInDays(new Date(), new Date(item.received_date));
          let agingCategory = "Current";
          
          if (daysInStock > 180) agingCategory = "Critical";
          else if (daysInStock > 90) agingCategory = "Aging";
          else if (daysInStock > 30) agingCategory = "Moderate";

          return {
            id: item.id,
            product_name: item.product?.name || "Unknown",
            batch_number: item.lot_number || "N/A",
            received_date: item.received_date,
            days_in_stock: daysInStock,
            quantity: item.quantity_remaining_kg || 0,
            warehouse_name: item.warehouse?.name || "Unknown",
            status: item.status,
            aging_category: agingCategory,
          };
        });

      if (filters.aging_category) {
        return processedData.filter((d) => d.aging_category === filters.aging_category);
      }

      return processedData;
    },
  });

  const calculateSummary = () => {
    const critical = agingData.filter((d) => d.aging_category === "Critical").length;
    const aging = agingData.filter((d) => d.aging_category === "Aging").length;
    const avgDays =
      agingData.length > 0
        ? Math.round(agingData.reduce((sum, d) => sum + d.days_in_stock, 0) / agingData.length)
        : 0;

    return {
      "Total Batches": agingData.length.toString(),
      "Critical (180+ days)": critical.toString(),
      "Aging (90-180 days)": aging.toString(),
      "Average Days": avgDays.toString(),
    };
  };

  const handleExport = async (format: "pdf" | "excel") => {
    try {
      setExporting(true);

      const reportData: ReportData = {
        title: "Inventory Aging Report",
        subtitle: "Analyze aging inventory to identify slow-moving or obsolete stock",
        columns: [
          { field: "product_name", header: "Product", width: 20 },
          { field: "batch_number", header: "Batch Number", width: 15 },
          {
            field: "received_date",
            header: "Receipt Date",
            format: formatDate,
          },
          { field: "days_in_stock", header: "Days in Stock", width: 15 },
          {
            field: "quantity",
            header: "Quantity (kg)",
            format: (v) => formatNumber(v),
          },
          { field: "warehouse_name", header: "Warehouse", width: 15 },
          {
            field: "aging_category",
            header: "Category",
            format: (v) => v.toUpperCase(),
          },
        ],
        rows: agingData,
        summary: calculateSummary(),
        generatedDate: new Date(),
        filters,
      };

      if (format === "pdf") {
        exportToPDF(reportData, "inventory-aging-report");
      } else {
        exportToExcel(reportData, "inventory-aging-report");
      }

      toast.success(`Exported to ${format.toUpperCase()} successfully!`);
    } catch (err) {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const getAgingColor = (category: string) => {
    switch (category) {
      case "Critical":
        return "bg-red-500/10 text-red-600";
      case "Aging":
        return "bg-amber-500/10 text-amber-600";
      case "Moderate":
        return "bg-yellow-500/10 text-yellow-600";
      default:
        return "bg-emerald-500/10 text-emerald-600";
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Inventory Aging Report"
        description="Analyze aging inventory to identify slow-moving or obsolete stock"
        breadcrumbs={[
          { label: "Warehouse" },
          { label: "Reports", to: "/warehouse/reports" },
          { label: "Inventory Aging" },
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
              <Label>Aging Category</Label>
              <Select
                value={filters.aging_category}
                onValueChange={(v) =>
                  setFilters({ ...filters, aging_category: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="Current">Current (0-30 days)</SelectItem>
                  <SelectItem value="Moderate">Moderate (31-90 days)</SelectItem>
                  <SelectItem value="Aging">Aging (91-180 days)</SelectItem>
                  <SelectItem value="Critical">Critical (180+ days)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(calculateSummary()).map(([key, value]) => (
          <Card key={key} className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/20">
            <div className="text-sm text-muted-foreground font-medium">{key}</div>
            <div className="text-2xl font-bold text-amber-500 mt-2">{value}</div>
          </Card>
        ))}
      </div>

      {/* Data Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Aging Inventory Details</h3>
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
        ) : agingData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No inventory data found with current filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Product</th>
                  <th className="px-6 py-4 text-left font-semibold">Batch #</th>
                  <th className="px-6 py-4 text-left font-semibold">Receipt Date</th>
                  <th className="px-6 py-4 text-center font-semibold">Days</th>
                  <th className="px-6 py-4 text-right font-semibold">Qty (kg)</th>
                  <th className="px-6 py-4 text-left font-semibold">Warehouse</th>
                  <th className="px-6 py-4 text-left font-semibold">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {agingData.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">{row.product_name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {row.batch_number}
                    </td>
                    <td className="px-6 py-4">{formatDate(row.received_date)}</td>
                    <td className="px-6 py-4 text-center font-semibold">
                      {row.days_in_stock}
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      {formatNumber(row.quantity)}
                    </td>
                    <td className="px-6 py-4">{row.warehouse_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getAgingColor(row.aging_category)}`}>
                        {row.aging_category.toUpperCase()}
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
