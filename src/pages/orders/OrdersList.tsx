import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Receipt } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type ExportOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_country: string;
  product: string;
  quantity: number;
  unit: string;
  total_amount: number;
  currency: string;
  status: string;
  payment_status: string;
  order_date: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500 hover:bg-yellow-600 text-white",
  confirmed: "bg-blue-500 hover:bg-blue-600 text-white",
  processing: "bg-orange-500 hover:bg-orange-600 text-white",
  shipped: "bg-purple-500 hover:bg-purple-600 text-white",
  delivered: "bg-green-500 hover:bg-green-600 text-white",
  cancelled: "bg-red-500 hover:bg-red-600 text-white",
};

const PAYMENT_COLORS: Record<string, string> = {
  unpaid: "bg-red-500 hover:bg-red-600 text-white",
  partial: "bg-yellow-500 hover:bg-yellow-600 text-white",
  paid: "bg-green-500 hover:bg-green-600 text-white",
};

export default function OrdersList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ExportOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from("export_orders")
          .select("*")
          .order("order_date", { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (err: any) {
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Export Orders</h1>
          <p className="text-sm text-muted-foreground">Manage your customer export orders</p>
        </div>
        <Button onClick={() => navigate("/orders/create")}>
          <Plus className="mr-2 h-4 w-4" /> Create Order
        </Button>
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
                  <p className="text-muted-foreground">No export orders found.</p>
                  <Button variant="link" onClick={() => navigate("/orders/create")}>Create the first order</Button>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow 
                  key={order.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <TableCell className="font-medium text-primary">{order.order_number}</TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>{order.customer_country}</TableCell>
                  <TableCell>{order.product}</TableCell>
                  <TableCell className="text-right">{order.quantity} {order.unit}</TableCell>
                  <TableCell className="text-right font-medium">
                    {order.currency} {Number(order.total_amount).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`capitalize ${STATUS_COLORS[order.status] || "bg-gray-500"}`}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`capitalize ${PAYMENT_COLORS[order.payment_status] || "bg-gray-500"}`}>
                      {order.payment_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
