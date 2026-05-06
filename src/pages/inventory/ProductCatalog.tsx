import { useNavigate } from "react-router-dom";
import { Plus, Loader2, PackageOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { supabase } from "@/integrations/supabase/client";

export default function ProductCatalog() {
  const nav = useNavigate();

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as any[];
    },
  });
  return (
    <div>
      <PageHeader title="Product Catalog" description="All export-ready products" breadcrumbs={[{ label: "Inventory" }, { label: "Products" }]}
        actions={<Button size="sm" onClick={() => nav("/inventory/products/create")}><Plus className="h-4 w-4 mr-1.5" />New Product</Button>} />
      {isLoading ? (
        <div className="erp-card flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !products || products.length === 0 ? (
        <EmptyState
          icon={<PackageOpen className="h-5 w-5" />}
          title="No products found"
          description="You haven't added any products to your catalog yet."
          action={
            <Button size="sm" className="btn-gold" onClick={() => nav("/inventory/products/create")}>
              <Plus className="h-4 w-4 mr-1.5" /> New Product
            </Button>
          }
        />
      ) : (
        <DataTable
          data={products}
          searchKeys={["sku", "name", "category"]}
          columns={[
            { key: "sku", header: "SKU", render: (r) => <span className="font-mono text-xs">{r.sku}</span> },
            { key: "name", header: "Product", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "category", header: "Category", render: (r) => <span className="text-sm text-muted-foreground">{r.category || "—"}</span> },
            { key: "uom", header: "UOM", render: (r) => <span className="text-xs">{r.unit || r.uom || "—"}</span> },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.is_active ? "active" : "inactive"} /> },
          ]}
        />
      )}
    </div>
  );
}
