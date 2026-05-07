import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Ship, Container as ContainerIcon, Anchor, Truck as TruckIcon, CheckCircle2, Loader2, Package, FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProformaInvoice } from "@/components/documents/ProformaInvoice";

export default function ShipmentDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [shipment, setShipment] = useState<any>(null);
  const [containers, setContainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  const fetchData = async () => {
    try {
      const { data: shipData, error: shipError } = await supabase
        .from("export_shipments")
        .select(`
          *,
          export_orders (
            order_number,
            product,
            quantity,
            unit,
            unit_price,
            total_amount,
            currency,
            customer_country,
            customer_email,
            hsn_code,
            incoterms,
            packing_details
          )
        `)
        .eq("id", id)
        .single();

      if (shipError) throw shipError;

      const { data: contData, error: contError } = await supabase
        .from("export_containers")
        .select("*")
        .eq("shipment_id", id);

      if (contError) throw contError;

      setShipment(shipData);
      setContainers(contData || []);
    } catch (err: any) {
      toast.error("Failed to load shipment details");
      nav("/shipments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("export_shipments")
        .update({ status: newStatus })
        .eq("id", id);
      
      if (error) throw error;
      
      setShipment(prev => ({ ...prev, status: newStatus }));
      toast.success(`Shipment status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!shipment) return <div className="p-12 text-center">Shipment not found</div>;

  const getTimeline = () => {
    const s = shipment.status;
    return [
      { icon: CheckCircle2, label: "Shipment created", at: new Date(shipment.created_at).toLocaleString(), done: true },
      { icon: ContainerIcon, label: "Container stuffing", at: s !== "Pending" ? "Completed" : "Scheduled", done: s !== "Pending" },
      { icon: Anchor, label: `Departed from ${shipment.origin_port}`, at: shipment.departure_date || "Pending", done: ["In Transit", "Delivered"].includes(s) },
      { icon: Ship, label: "In transit — At Sea", at: s === "In Transit" ? "Active" : "Pending", done: ["In Transit", "Delivered"].includes(s), current: s === "In Transit" },
      { icon: Anchor, label: `Arrival at ${shipment.destination_port}`, at: shipment.eta || "Estimated", done: s === "Delivered" },
      { icon: TruckIcon, label: "Final delivery", at: s === "Delivered" ? "Completed" : "Pending", done: s === "Delivered" },
    ];
  };

  return (
    <div>
      <PageHeader title={shipment.shipment_number} description={`${shipment.customer_name} · ${shipment.carrier}`} breadcrumbs={[{ label: "Shipments", to: "/shipments" }, { label: shipment.shipment_number }]}
        actions={<div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => nav(`/documents/invoices/${id}`)}><FileText className="h-4 w-4 mr-1.5 text-primary" />Generate PI</Button>
          <Button variant="outline" size="sm" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" />Back</Button>
        </div>} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Section title="Shipping Timeline">
            <ol className="relative border-l-2 border-border ml-3 space-y-8 py-4">
              {getTimeline().map((e, i) => {
                const Icon = e.icon;
                return (
                  <li key={i} className="ml-6">
                    <span className={`absolute -left-[13px] flex items-center justify-center h-6 w-6 rounded-full border-2 border-background ${e.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <Icon className="h-3 w-3" />
                    </span>
                    <div className={`text-sm font-semibold ${e.current ? "text-primary" : ""}`}>{e.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{e.at}</div>
                  </li>
                );
              })}
            </ol>
          </Section>

          <Section title="Container Breakdown">
            <div className="space-y-3">
              {containers.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-bold font-mono">{c.container_number}</div>
                      <div className="text-xs text-muted-foreground">{c.container_type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{c.weight_kg ? `${c.weight_kg.toLocaleString()} kg` : "No weight"}</div>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="Shipment Status">
            <div className="flex flex-col gap-3">
              <StatusBadge status={shipment.status} />
              <div className="pt-3 border-t border-border mt-1">
                <label className="text-xs font-medium text-muted-foreground block mb-2">Change Voyage Status</label>
                <Select value={shipment.status} onValueChange={handleStatusChange} disabled={updating}>
                  <SelectTrigger className="w-full text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="In Transit">In Transit</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          <Section title="Route Information">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <div className="font-medium">Origin Port</div>
                <div className="text-xs text-muted-foreground">{shipment.origin_port}</div>
              </div>
            </div>
            <div className="ml-2 my-1 h-6 border-l border-dashed border-muted-foreground" />
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary mt-1" />
              <div>
                <div className="font-medium">Destination Port</div>
                <div className="text-xs text-muted-foreground">{shipment.destination_port}</div>
              </div>
            </div>
          </Section>

          <Section title="Linked Order">
            <dl className="space-y-2 text-sm">
              {(() => {
                const order = Array.isArray(shipment.export_orders) ? shipment.export_orders[0] : shipment.export_orders;
                return (
                  <>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Order Ref</dt><dd className="font-mono">{order?.order_number || 'N/A'}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Product</dt><dd>{order?.product || 'N/A'}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Carrier</dt><dd>{shipment.carrier}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Total Qty</dt><dd>{order?.quantity || 0} {order?.unit || ''}</dd></div>
                  </>
                );
              })()}
            </dl>
          </Section>
        </div>
      </div>
    </div>
  );
}
