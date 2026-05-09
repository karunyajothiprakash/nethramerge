import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, FileCheck, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export default function ConvertQuotation() {
  const nav = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: ready = [], isLoading } = useQuery({
    queryKey: ['quotations_to_convert', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          customer:customers(name, country)
        `)
        .eq('company_id', profile.company_id)
        .eq('status', 'Approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id
  });

  const convertMutation = useMutation({
    mutationFn: async (quote: any) => {
      const year = new Date().getFullYear();
      const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const orderNumber = `ORD-${year}-${rand}`;

      // 1. Create Order
      const { data: order, error: orderErr } = await supabase
        .from('export_orders')
        .insert({
          company_id: profile!.company_id,
          customer_id: quote.customer_id,
          order_number: orderNumber,
          total_amount: quote.amount,
          currency: quote.currency,
          status: 'Pending',
          payment_terms: quote.payment_terms,
          payment_status: 'unpaid',
          notes: `Converted from Quotation ${quote.quotation_number}`
        })
        .select('id')
        .single();
      
      if (orderErr) throw orderErr;

      // 2. Update Quotation Status
      const { error: updateErr } = await supabase
        .from('quotations')
        .update({ status: 'Converted' })
        .eq('id', quote.id);
      
      if (updateErr) throw updateErr;

      return order;
    },
    onSuccess: (data, variables) => {
      toast.success(`Quotation ${variables.quotation_number} converted to Sales Order successfully!`);
      queryClient.invalidateQueries({ queryKey: ['quotations_to_convert'] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      nav("/orders");
    },
    onError: (err: any) => {
      toast.error(err.message || "Conversion failed");
    }
  });

  return (
    <div>
      <PageHeader 
        title="Convert to Sales Order" 
        description="Approved quotations ready to convert into official orders" 
        breadcrumbs={[{ label: "Quotations", to: "/quotations" }, { label: "Convert" }]} 
      />
      <Section>
        {isLoading ? (
          <div className="py-24 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
          </div>
        ) : ready.length === 0 ? (
          <div className="py-24 text-center">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold">No Quotations Ready</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
              Only quotations with "Approved" status can be converted into official sales orders.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => nav("/quotations")}>
              View All Quotations
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              {ready.length} quotation(s) ready for conversion
            </div>
            {ready.map((q: any) => (
              <div key={q.id} className="flex items-center justify-between p-6 bg-card border border-border rounded-xl shadow-sm hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-success-muted text-success flex items-center justify-center text-lg font-bold">
                    <FileCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-base font-bold">{q.customer?.name || 'Unknown Customer'}</div>
                    <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mt-1">
                      {q.quotation_number} · {q.currency} {Number(q.amount).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={q.status} />
                  <Button 
                    className="btn-gold"
                    size="sm" 
                    onClick={() => convertMutation.mutate(q)}
                    disabled={convertMutation.isPending}
                  >
                    {convertMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    Convert to Order
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
