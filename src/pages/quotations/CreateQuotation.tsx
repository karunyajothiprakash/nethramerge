import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Save, Trash2, Eye, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Section, FormGrid, FormRow } from "@/components/shared/FormShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Item = { id: string; product_id: string; qty: number; price: number };

export default function CreateQuotation() {
  const nav = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [customerId, setCustomerId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [validUntil, setValidUntil] = useState("");
  const [packingType, setPackingType] = useState("Box");
  const [packingCharge, setPackingCharge] = useState(0);
  const [transportMethod, setTransportMethod] = useState("");
  const [transportCharges, setTransportCharges] = useState(0);
  const [items, setItems] = useState<Item[]>([
    { id: crypto.randomUUID(), product_id: "", qty: 1, price: 0 },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: custs } = await supabase.from("customers").select("id, name");
      const { data: prods } = await supabase.from("products").select("id, name");
      if (custs) setCustomers(custs);
      if (prods) setProducts(prods);
    };
    fetchData();
  }, []);

  const addItem = () => setItems((s) => [...s, { id: crypto.randomUUID(), product_id: "", qty: 1, price: 0 }]);
  const removeItem = (id: string) => setItems((s) => s.filter((i) => i.id !== id));
  const updateItem = (id: string, patch: Partial<Item>) => setItems((s) => s.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const total = subtotal + packingCharge + transportCharges;

  const handleSave = async () => {
    if (!profile?.company_id) {
      toast.error("You must be assigned to a company to create quotations");
      return;
    }
    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }

    setLoading(true);
    try {
      const qNumber = `QT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      const { data: qData, error: qError } = await supabase
        .from("quotations")
        .insert({
          company_id: profile.company_id,
          customer_id: customerId,
          quotation_number: qNumber,
          total_amount: total,
          currency,
          valid_until: validUntil || null,
          packing_type: packingType,
          packing_charge: packingCharge,
          transport_method: transportMethod,
          transport_charges: transportCharges,
          status: "Draft"
        })
        .select()
        .single();

      if (qError) throw qError;

      const lineItems = items.map(item => ({
        quotation_id: qData.id,
        product_id: item.product_id || null,
        quantity: item.qty,
        unit_price: item.price
      }));

      const { error: itemsError } = await supabase.from("quotation_items").insert(lineItems);
      if (itemsError) throw itemsError;

      toast.success("Quotation created successfully");
      nav("/quotations");
    } catch (err: any) {
      console.error("Error saving quotation:", err);
      toast.error(err.message || "Failed to save quotation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Create Quotation" breadcrumbs={[{ label: "Quotations", to: "/quotations" }, { label: "New" }]}
        actions={<>
          <Button variant="outline" size="sm" onClick={() => nav(-1)} disabled={loading}><ArrowLeft className="h-4 w-4 mr-1.5" />Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save Quotation
          </Button>
        </>}
      />
      <div className="space-y-4">
        <Section title="Customer & Terms">
          <FormGrid cols={3}>
            <FormRow label="Customer" required>
              <Select onValueChange={setCustomerId} value={customerId}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Currency">
              <Select onValueChange={setCurrency} value={currency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="INR">INR</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Valid until">
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </FormRow>
          </FormGrid>
        </Section>

        <Section title="Line Items" actions={<Button variant="outline" size="sm" onClick={addItem} disabled={loading}><Plus className="h-3.5 w-3.5 mr-1" />Add Item</Button>}>
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-2">Product</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2 w-24">Qty</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2 w-32">Unit Price</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2 w-32">Total</th>
                <th className="px-3 py-2 w-10" />
              </tr></thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-b last:border-0 border-border">
                    <td className="px-5 py-2">
                      <Select onValueChange={(val) => updateItem(i.id, { product_id: val })} value={i.product_id}>
                        <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                        <SelectContent>
                          {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2"><Input type="number" value={i.qty} onChange={(e) => updateItem(i.id, { qty: +e.target.value || 0 })} /></td>
                    <td className="px-3 py-2"><Input type="number" value={i.price} onChange={(e) => updateItem(i.id, { price: +e.target.value || 0 })} /></td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">{(i.qty * i.price).toLocaleString()}</td>
                    <td className="px-3 py-2"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(i.id)} disabled={items.length === 1}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <div className="w-64 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{currency} {subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Packing Charge</span><span className="tabular-nums">{currency} {packingCharge.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Transport Charges</span><span className="tabular-nums">{currency} {transportCharges.toLocaleString()}</span></div>
              <div className="flex justify-between pt-2 border-t border-border font-semibold"><span>Total</span><span className="tabular-nums">{currency} {total.toLocaleString()}</span></div>
            </div>
          </div>
        </Section>

        <Section title="Packing Details">
          <FormGrid cols={3}>
            <FormRow label="Packing Method">
              <Select onValueChange={setPackingType} value={packingType}>
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Box">Box</SelectItem>
                  <SelectItem value="Bag">Bag</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Packing Charge">
              <Input 
                type="text" 
                value={packingCharge} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d*\.?\d*$/.test(val)) {
                    setPackingCharge(Number(val) || 0);
                  }
                }} 
                placeholder="0.00"
              />
            </FormRow>
          </FormGrid>
        </Section>

        <Section title="Transport Details">
          <FormGrid cols={3}>
            <FormRow label="Transport">
              <Input 
                type="text" 
                value={transportMethod} 
                onChange={(e) => setTransportMethod(e.target.value)} 
                placeholder="e.g. Sea Freight, Air, Truck"
              />
            </FormRow>
            <FormRow label="Transport Charges">
              <Input 
                type="text" 
                value={transportCharges} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d*\.?\d*$/.test(val)) {
                    setTransportCharges(Number(val) || 0);
                  }
                }} 
                placeholder="0.00"
              />
            </FormRow>
          </FormGrid>
        </Section>
      </div>
    </div>
  );
}
