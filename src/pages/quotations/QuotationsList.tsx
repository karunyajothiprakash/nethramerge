import { useNavigate } from "react-router-dom";
import { Plus, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function QuotationsList() {
  const nav = useNavigate();
  const { profile } = useAuth();

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['quotations', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          id,
          quotation_number,
          amount,
          currency,
          status,
          items_count,
          valid_until,
          created_at,
          customer:customers(name)
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((q: any) => ({
        id: q.id,
        quotation_number: q.quotation_number,
        customer: q.customer?.name || 'Unknown',
        items: q.items_count || 0,
        amount: q.amount,
        currency: q.currency,
        status: q.status,
        validUntil: q.valid_until ? new Date(q.valid_until).toLocaleDateString() : 'N/A',
        createdAt: new Date(q.created_at).toLocaleDateString(),
      }));
    },
    enabled: !!profile?.company_id
  });

  return (
    <div>
      <PageHeader title="Quotations" description="Manage all customer price quotes" breadcrumbs={[{ label: "Quotations" }]}
        actions={<>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
          <Button size="sm" onClick={() => nav("/quotations/create")}><Plus className="h-4 w-4 mr-1.5" />New Quotation</Button>
        </>}
      />
      <DataTable
        data={quotations}
        isLoading={isLoading}
        searchKeys={["quotation_number", "customer"]}
        onRowClick={(r) => nav(`/quotations/${r.id}`)}
        columns={[
          { key: "quotation_number", header: "Quote #", render: (r) => <span className="font-mono text-xs">{r.quotation_number}</span> },
          { key: "customer", header: "Customer", render: (r) => <span className="font-medium">{r.customer}</span> },
          { key: "items", header: "Items", render: (r) => <span className="tabular-nums">{r.items}</span> },
          { key: "amount", header: "Amount", render: (r) => <span className="font-medium tabular-nums">{r.currency} {Number(r.amount).toLocaleString()}</span> },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "validUntil", header: "Valid Until", render: (r) => <span className="text-xs text-muted-foreground">{r.validUntil}</span> },
          { key: "createdAt", header: "Created", render: (r) => <span className="text-xs text-muted-foreground">{r.createdAt}</span> },
        ]}
      />
    </div>
  );
}
