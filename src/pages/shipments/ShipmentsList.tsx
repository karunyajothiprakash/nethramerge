import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { shipments } from "@/data/mock";

export default function ShipmentsList() {
  const nav = useNavigate();
  return (
    <div>
      <PageHeader title="Shipment Register" description="All outbound shipments and their status" breadcrumbs={[{ label: "Shipments" }]}
        actions={<Button size="sm" onClick={() => nav("/shipments/create")}><Plus className="h-4 w-4 mr-1.5" />New Shipment</Button>}
      />
      <DataTable
        data={shipments}
        searchKeys={["id", "customer", "destination"]}
        onRowClick={(r) => nav(`/shipments/${r.id}`)}
        columns={[
          { key: "id", header: "Shipment", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
          { key: "customer", header: "Customer", render: (r) => <span className="font-medium">{r.customer}</span> },
          { key: "route", header: "Route", render: (r) => <span className="text-xs">{r.origin} → {r.destination}</span> },
          { key: "carrier", header: "Carrier", render: (r) => r.carrier },
          { key: "containers", header: "Containers", render: (r) => <span className="tabular-nums">{r.containerCount}</span> },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "eta", header: "ETA", render: (r) => <span className="text-xs text-muted-foreground">{r.eta}</span> },
        ]}
      />
    </div>
  );
}
