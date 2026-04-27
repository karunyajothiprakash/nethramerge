import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Section } from "@/components/shared/FormShell";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { shipments } from "@/data/mock";

export default function ShipmentAnalytics() {
  return (
    <div>
      <PageHeader title="Shipment Analytics" description="Delivery performance, container utilization and delays" breadcrumbs={[{ label: "Dashboards" }, { label: "Shipments" }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="On-Time Delivery" value="92.4%" delta={{ value: "+1.8%", positive: true }} />
        <StatCard label="Avg Transit Days" value="14.2" delta={{ value: "-0.6", positive: true }} />
        <StatCard label="Active Containers" value="38" delta={{ value: "+5", positive: true }} />
        <StatCard label="Delayed" value="3" delta={{ value: "-2", positive: true }} />
      </div>
      <Section title="Active Shipments">
        <DataTable
          data={shipments}
          searchKeys={["id", "customer", "destination"]}
          columns={[
            { key: "id", header: "Shipment", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
            { key: "customer", header: "Customer", render: (r) => r.customer },
            { key: "route", header: "Route", render: (r) => <span className="text-xs">{r.origin} → {r.destination}</span> },
            { key: "carrier", header: "Carrier", render: (r) => r.carrier },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "eta", header: "ETA", render: (r) => <span className="text-xs">{r.eta}</span> },
          ]}
        />
      </Section>
    </div>
  );
}
