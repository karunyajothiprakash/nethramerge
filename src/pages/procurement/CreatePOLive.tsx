import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2, Plus, Trash2, Save, Send } from "lucide-react";
import { toast } from "sonner";

type POItem = {
  id: string;
  product: string;
  quantity: number;
  unit: string;
  unit_price: number;
};

export default function CreatePOLive() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form
  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [items, setItems] = useState<POItem[]>([
    { id: "1", product: "", quantity: 1, unit: "kg", unit_price: 0 }
  ]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const { data, error } = await supabase.from("suppliers").select("id, name").eq("status", "active");
        if (error) throw error;
        setSuppliers(data || []);
      } catch (err: any) {
        toast.error("Failed to load suppliers");
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), product: "", quantity: 1, unit: "kg", unit_price: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof POItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSave = async (status: 'draft' | 'sent') => {
    if (!supplierId) return toast.error("Please select a supplier");
    if (items.some(i => !i.product)) return toast.error("Please fill all product names");

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) throw new Error("Authentication required");

      const cleanItems = items.map(({ id, ...rest }) => rest);
      
      // Auto generate PO Number like PO-2026-001
      const year = new Date().getFullYear();
      const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const poNumber = `PO-${year}-${rand}`;

      const { error } = await supabase.from("purchase_orders").insert({
        po_number: poNumber,
        supplier_id: supplierId,
        status,
        expected_delivery: expectedDate ? new Date(expectedDate).toISOString() : null,
        total_amount: totalAmount,
        currency,
        items: cleanItems,
        notes,
        created_by: userId
      });

      if (error) throw error;

      toast.success(`Purchase order ${status === 'draft' ? 'saved as draft' : 'sent'} successfully`);
      navigate("/procurement/orders");
    } catch (err: any) {
      toast.error(err.message || "Failed to create purchase order");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/procurement/orders")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Purchase Order</h1>
          <p className="text-sm text-muted-foreground">Draft a new order to a supplier</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Order Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-24">Qty</TableHead>
                    <TableHead className="w-28">Unit</TableHead>
                    <TableHead className="w-32">Price</TableHead>
                    <TableHead className="text-right w-32">Total</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input 
                          placeholder="Product Name" 
                          value={item.product} 
                          onChange={(e) => updateItem(item.id, "product", e.target.value)} 
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" min="1" 
                          value={item.quantity} 
                          onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))} 
                        />
                      </TableCell>
                      <TableCell>
                        <Select value={item.unit} onValueChange={(val) => updateItem(item.id, "unit", val)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="ton">ton</SelectItem>
                            <SelectItem value="piece">piece</SelectItem>
                            <SelectItem value="box">box</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" min="0" step="0.01" 
                          value={item.unit_price} 
                          onChange={(e) => updateItem(item.id, "unit_price", Number(e.target.value))} 
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium pt-5">
                        {(item.quantity * item.unit_price).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} disabled={items.length === 1}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button variant="outline" size="sm" onClick={addItem}><Plus className="mr-2 h-4 w-4" /> Add Item</Button>
          </CardContent>
          <CardFooter className="justify-end border-t p-4 bg-muted/20">
            <div className="text-lg font-bold">
              Total: {currency} {totalAmount.toLocaleString()}
            </div>
          </CardFooter>
        </Card>

        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Expected Delivery</Label>
              <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea 
                placeholder="Special instructions..." 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                className="h-24"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 border-t p-4">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              onClick={() => handleSave('sent')}
              disabled={saving}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Save & Send
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => handleSave('draft')}
              disabled={saving}
            >
              <Save className="mr-2 h-4 w-4" /> Save as Draft
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
