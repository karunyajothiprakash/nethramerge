import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Section, FormGrid, FormRow } from "@/components/shared/FormShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CreateShipment() {
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);
  
  // State
  const [orders, setOrders] = useState<any[]>([]);
  const [carriersList, setCarriersList] = useState<any[]>([]);
  const [portsList, setPortsList] = useState<any[]>([]);
  const [containerTypesList, setContainerTypesList] = useState<any[]>([]);

  const [orderId, setOrderId] = useState("");
  const [carrier, setCarrier] = useState("");
  const [originPort, setOriginPort] = useState("");
  const [destinationPort, setDestinationPort] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [eta, setEta] = useState("");
  const [containerCount, setContainerCount] = useState("1");
  const [containerType, setContainerType] = useState("");

  // New Port State
  const [isPortModalOpen, setIsPortModalOpen] = useState(false);
  const [newPortName, setNewPortName] = useState("");
  const [newPortCountry, setNewPortCountry] = useState("");
  const [newPortCode, setNewPortCode] = useState("");
  const [savingPort, setSavingPort] = useState(false);

  const fetchData = async () => {
    const [ordersRes, carriersRes, portsRes, containersRes, moreOrdersRes] = await Promise.all([
      supabase.from("export_orders").select("id, order_number, customer_name").eq("status", "shipped").order("created_at", { ascending: false }),
      supabase.from("shipping_carriers").select("name, code").order("name"),
      supabase.from("shipping_ports").select("name, country, code").order("name"),
      supabase.from("container_types").select("name").order("name"),
      supabase.from("export_orders").select("id, order_number, customer_name").in("status", ["confirmed", "processing"]).order("created_at", { ascending: false })
    ]);

    let allOrders = [];
    if (ordersRes.data) allOrders = [...allOrders, ...ordersRes.data];
    if (moreOrdersRes.data) allOrders = [...allOrders, ...moreOrdersRes.data];
    
    setOrders(allOrders);
    if (carriersRes.data) setCarriersList(carriersRes.data);
    if (portsRes.data) setPortsList(portsRes.data);
    if (containersRes.data) setContainerTypesList(containersRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortName || !newPortCode) return toast.error("Port name and code are required");
    
    setSavingPort(true);
    try {
      const { error } = await supabase.from("shipping_ports").insert({
        name: newPortName,
        country: newPortCountry,
        code: newPortCode.toUpperCase()
      });
      if (error) throw error;
      toast.success("New port added successfully");
      setIsPortModalOpen(false);
      setNewPortName("");
      setNewPortCountry("");
      setNewPortCode("");
      fetchData(); // Refresh the dropdowns
    } catch (err: any) {
      toast.error(err.message || "Failed to add port");
    } finally {
      setSavingPort(false);
    }
  };

  const handleSave = async () => {
    if (!orderId || !carrier || !originPort || !destinationPort || !containerType) {
      return toast.error("Please fill in all required fields");
    }

    setSaving(true);
    try {
      const selectedOrder = orders.find(o => o.id === orderId);
      const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const shipmentNumber = `SHP-${new Date().getFullYear()}-${rand}`;

      // Insert shipment
      const { data: shipment, error: shipErr } = await supabase.from("export_shipments").insert({
        order_id: orderId,
        shipment_number: shipmentNumber,
        customer_name: selectedOrder?.customer_name,
        carrier,
        origin_port: originPort,
        destination_port: destinationPort,
        departure_date: departureDate || null,
        eta: eta || null,
        status: 'Pending'
      }).select().single();

      if (shipErr) throw shipErr;

      // Insert containers
      const count = parseInt(containerCount) || 1;
      const containersToInsert = Array.from({ length: count }).map((_, i) => ({
        shipment_id: shipment.id,
        container_number: `TBD-${i+1}`,
        container_type: containerType,
        status: 'Pending'
      }));

      const { error: contErr } = await supabase.from("export_containers").insert(containersToInsert);
      if (contErr) throw contErr;

      toast.success("Shipment created successfully!");
      nav("/shipments");
    } catch (err: any) {
      toast.error(err.message || "Failed to create shipment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Create Shipment" breadcrumbs={[{ label: "Shipments", to: "/shipments" }, { label: "New" }]}
        actions={<>
          <Button variant="outline" size="sm" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" />Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save Shipment
          </Button>
        </>}
      />
      
      {/* Port Creation Modal */}
      <Dialog open={isPortModalOpen} onOpenChange={setIsPortModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Shipping Port</DialogTitle></DialogHeader>
          <form onSubmit={handleAddPort} className="space-y-4 pt-4">
            <div className="space-y-2"><Label>Port Name *</Label><Input value={newPortName} onChange={e => setNewPortName(e.target.value)} placeholder="e.g., Los Angeles" required /></div>
            <div className="space-y-2"><Label>Country</Label><Input value={newPortCountry} onChange={e => setNewPortCountry(e.target.value)} placeholder="e.g., USA" /></div>
            <div className="space-y-2"><Label>Port Code *</Label><Input value={newPortCode} onChange={e => setNewPortCode(e.target.value)} placeholder="e.g., USLAX" required /></div>
            <Button type="submit" disabled={savingPort} className="w-full">
              {savingPort && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Port
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-4 max-w-4xl">
        <Section title="Order Reference">
          <FormGrid>
            <FormRow label="Sales Order" required>
              <Select value={orderId} onValueChange={setOrderId}>
                <SelectTrigger><SelectValue placeholder="Select an order" /></SelectTrigger>
                <SelectContent>
                  {orders.map(o => <SelectItem key={o.id} value={o.id}>{o.order_number} ({o.customer_name})</SelectItem>)}
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Carrier" required>
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
                <SelectContent>
                  {carriersList.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormRow>
          </FormGrid>
        </Section>
        <Section title="Route">
          <FormGrid>
            <FormRow label="Port of loading" required>
              <div className="flex gap-2">
                <Select value={originPort} onValueChange={setOriginPort}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select origin port" /></SelectTrigger>
                  <SelectContent>
                    {portsList.map(p => <SelectItem key={p.code} value={p.name}>{p.name} ({p.code})</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => setIsPortModalOpen(true)} title="Add new port">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </FormRow>
            <FormRow label="Port of discharge" required>
              <div className="flex gap-2">
                <Select value={destinationPort} onValueChange={setDestinationPort}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select destination port" /></SelectTrigger>
                  <SelectContent>
                    {portsList.map(p => <SelectItem key={p.code} value={p.name}>{p.name} ({p.code})</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => setIsPortModalOpen(true)} title="Add new port">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </FormRow>
            <FormRow label="Departure date"><Input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} /></FormRow>
            <FormRow label="ETA"><Input type="date" value={eta} onChange={e => setEta(e.target.value)} /></FormRow>
          </FormGrid>
        </Section>
        <Section title="Containers">
          <FormGrid>
            <FormRow label="Number of containers"><Input type="number" min="1" value={containerCount} onChange={e => setContainerCount(e.target.value)} /></FormRow>
            <FormRow label="Container type" required>
              <Select value={containerType} onValueChange={setContainerType}>
                <SelectTrigger><SelectValue placeholder="Select container type" /></SelectTrigger>
                <SelectContent>
                  {containerTypesList.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormRow>
          </FormGrid>
        </Section>
      </div>
    </div>
  );
}
