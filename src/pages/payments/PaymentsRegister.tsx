import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { payments, invoices } from "@/data/mock";

export default function PaymentsRegister() {
  const all = [
    ...payments.map((p) => ({ id: p.id, ref: p.invoiceId, party: p.customer, amount: p.amount, currency: p.currency, method: p.method, status: p.status, date: p.receivedAt })),
    ...invoices.filter(i => i.status !== "Paid").map((i) => ({ id: i.id, ref: i.orderId, party: i.customer, amount: i.amount, currency: i.currency, method: "Pending", status: i.status, date: i.dueAt })),
  ];
  return (
    <div>
      <PageHeader title="Payment Register" description="All incoming and outstanding payments" breadcrumbs={[{ label: "Payments" }]} />
      <DataTable
        data={all}
        searchKeys={["id", "party"]}
        columns={[
          { key: "id", header: "ID", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
          { key: "party", header: "Party", render: (r) => <span className="font-medium">{r.party}</span> },
          { key: "ref", header: "Reference", render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.ref}</span> },
          { key: "method", header: "Method", render: (r) => <span className="text-sm">{r.method}</span> },
          { key: "amount", header: "Amount", render: (r) => <span className="font-medium tabular-nums">{r.currency} {r.amount.toLocaleString()}</span> },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "date", header: "Date", render: (r) => <span className="text-xs text-muted-foreground">{r.date}</span> },
        ]}
      />
    </div>
  );
}
