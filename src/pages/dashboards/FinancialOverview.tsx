import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Section } from "@/components/shared/FormShell";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { salesByMonth } from "@/data/mock";

export default function FinancialOverview() {
  return (
    <div>
      <PageHeader title="Financial Overview" description="Cash position, receivables and currency exposure" breadcrumbs={[{ label: "Dashboards" }, { label: "Financial" }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Receivables" value="$413K" delta={{ value: "+$28K", positive: false }} />
        <StatCard label="Payables" value="$184K" delta={{ value: "-$12K", positive: true }} />
        <StatCard label="Cash on Hand" value="$1.24M" delta={{ value: "+$92K", positive: true }} />
        <StatCard label="Overdue" value="$124K" delta={{ value: "+$24K", positive: false }} />
      </div>
      <Section title="Cash Flow">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesByMonth}>
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
        </div>
      </Section>
    </div>
  );
}
