import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { shipments } from "@/data/mock";

export default function DeliveryStatus() {
  return (
    <div>
      <PageHeader title="Delivery Status" description="End-to-end delivery monitoring" breadcrumbs={[{ label: "Shipments" }, { label: "Delivery" }]} />
      <DataTable
        data={shipments}
        searchKeys={["id", "destination"]}
        columns={[
          { key: "id", header: "Shipment", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
          { key: "dest", header: "Destination", render: (r) => r.destination },
          { key: "carrier", header: "Carrier", render: (r) => r.carrier },
          { key: "progress", header: "Progress", render: (r) => {
            const pct = r.status === "Delivered" ? 100 : r.status === "In Transit" ? 65 : r.status === "Processing" ? 25 : 5;
            return <div className="flex items-center gap-2"><div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div><span className="text-xs tabular-nums">{pct}%</span></div>;
          } },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "eta", header: "ETA", render: (r) => <span className="text-xs">{r.eta}</span> },
        ]}
      />
    </div>
  );
}
