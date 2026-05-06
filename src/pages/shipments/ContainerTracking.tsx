import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ContainerTracking() {
  const [containers, setContainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContainers = async () => {
      try {
        const { data, error } = await supabase
          .from("export_containers")
          .select(`
            *,
            export_shipments (
              shipment_number,
              origin_port,
              destination_port,
              status
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Map database records to the table format
        const formattedData = (data || []).map(c => ({
          id: c.container_number,
          shipmentId: c.export_shipments?.shipment_number || "Unknown",
          type: c.container_type,
          weight: c.weight_kg ? `${c.weight_kg} kg` : 'TBD',
          status: c.status || c.export_shipments?.status || "Pending",
          location: c.export_shipments?.status === "Delivered" 
            ? c.export_shipments?.destination_port 
            : c.export_shipments?.status === "In Transit" 
              ? "At sea" 
              : c.export_shipments?.origin_port || "Unknown Location",
        }));

        setContainers(formattedData);
      } catch (err: any) {
        toast.error("Failed to load containers");
      } finally {
        setLoading(false);
      }
    };

    fetchContainers();
  }, []);

  return (
    <div>
      <PageHeader 
        title="Container Tracking" 
        description="Live container locations across all shipments" 
        breadcrumbs={[{ label: "Shipments" }, { label: "Containers" }]} 
      />
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          data={containers}
          searchKeys={["id", "shipmentId", "location"]}
          columns={[
            { key: "id", header: "Container", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
            { key: "shipment", header: "Shipment", render: (r) => <span className="text-xs text-muted-foreground">{r.shipmentId}</span> },
            { key: "type", header: "Type", render: (r) => r.type },
            { key: "weight", header: "Weight", render: (r) => <span className="tabular-nums">{r.weight}</span> },
            { key: "loc", header: "Location", render: (r) => r.location },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
      )}
    </div>
  );
}
