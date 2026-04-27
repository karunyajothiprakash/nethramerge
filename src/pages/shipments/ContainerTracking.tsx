import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { shipments } from "@/data/mock";

const containers = shipments.flatMap((s) =>
  Array.from({ length: s.containerCount }).map((_, i) => ({
    id: `${s.id}-C${i + 1}`,
    shipmentId: s.id,
    type: i % 2 === 0 ? "40ft HC" : "20ft Std",
    sealed: true,
    weight: 22 + i * 2,
    status: s.status,
    location: s.status === "Delivered" ? s.destination : s.status === "In Transit" ? "At sea" : s.origin,
  }))
);

export default function ContainerTracking() {
  return (
    <div>
      <PageHeader title="Container Tracking" description="Live container locations across all shipments" breadcrumbs={[{ label: "Shipments" }, { label: "Containers" }]} />
      <DataTable
        data={containers}
        searchKeys={["id", "shipmentId"]}
        columns={[
          { key: "id", header: "Container", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
          { key: "shipment", header: "Shipment", render: (r) => <span className="text-xs text-muted-foreground">{r.shipmentId}</span> },
          { key: "type", header: "Type", render: (r) => r.type },
          { key: "weight", header: "Weight", render: (r) => <span className="tabular-nums">{r.weight} t</span> },
          { key: "loc", header: "Location", render: (r) => r.location },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </div>
  );
}
