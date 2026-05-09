import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Section } from "@/components/shared/FormShell";
import { Wallet } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function FinancialOverview() {
  const { data: realSales } = useQuery({
    queryKey: ['dashboard_sales'],
    queryFn: async () => {
      const { data, error } = await supabase.from('view_sales_by_month' as any).select('*');
      if (error) throw error;
      return data;
    },
    retry: false
  });

  const { data: receivablesData } = useQuery({
    queryKey: ['financial_receivables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('export_orders')
        .select('total_amount')
        .neq('status', 'paid');
      if (error) throw error;
      return data;
    }
  });

  const chartSales = realSales || [];
  const receivables = (receivablesData || []).reduce((sum, item) => sum + Number(item.total_amount || 0), 0);

  return (
    <div>
      <PageHeader title="Financial Overview" description="Cash position, receivables and currency exposure" breadcrumbs={[{ label: "Dashboards" }, { label: "Financial" }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Receivables" value={`$${(receivables/1000).toFixed(0)}K`} delta={{ value: "Live", positive: false }} />
        <StatCard label="Payables" value="$0K" delta={{ value: "Live", positive: true }} />
        <StatCard label="Cash on Hand" value="$0K" delta={{ value: "Live", positive: true }} />
        <StatCard label="Overdue" value="$0K" delta={{ value: "Live", positive: false }} />
      </div>
      <Section title="Cash Flow">
        <div className="h-72 flex items-center justify-center">
          {chartSales.length === 0 ? (
            <div className="text-center">
              <Wallet className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-20" />
              <p className="text-xs text-muted-foreground italic">No cash flow data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartSales}>
                <defs>
                  <linearGradient id="cf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-2))" fill="url(#cf)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Section>
    </div>
  );
}
