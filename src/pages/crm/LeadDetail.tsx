import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
<<<<<<< HEAD
import { ArrowLeft, Edit, Mail, Phone, Building, Calendar, Package, UserCheck, Loader2 } from "lucide-react";
=======
import { useState } from "react";
import { ArrowLeft, Edit, Mail, Phone, Building, Calendar, DollarSign, UserCheck, Send, Loader2 } from "lucide-react";
>>>>>>> 2b5d6ca (update 3)
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
<<<<<<< HEAD
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

type Activity = {
  id: string;
  title: string;
  type: string;
  created_at: string;
  completed: boolean;
  profiles?: { full_name: string };
};

type Lead = {
  id: string;
  company_name: string;
  contact_name: string;
  country: string;
  interested_product: string;
  stage: string;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string };
};
=======
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { leads } from "@/data/mock";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
>>>>>>> 2b5d6ca (update 3)

export default function LeadDetail() {
  const { id } = useParams();
  const nav = useNavigate();
<<<<<<< HEAD
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeadDetails() {
      if (!id) return;
      try {
        const { data: leadData, error: leadError } = await supabase
          .from("leads")
          .select(`*, profiles:assigned_to(full_name)`)
          .eq("id", id)
          .single();

        if (leadError) throw leadError;
        setLead(leadData as unknown as Lead);

        const { data: acts, error: actsError } = await supabase
          .from("activities")
          .select(`id, title, type, created_at, completed, profiles:created_by(full_name)`)
          .eq("lead_id", id)
          .order("created_at", { ascending: false });

        if (actsError) throw actsError;
        setActivities(acts as unknown as Activity[]);
      } catch (error: any) {
        toast.error(error.message || "Failed to load lead details");
      } finally {
        setLoading(false);
      }
    }
    fetchLeadDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lead) {
    return <div className="p-6">Lead not found</div>;
  }

  const ownerName = lead.profiles?.full_name || "Unassigned";
=======
  const lead = leads.find((l) => l.id === id) ?? leads[0];
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendEmail = async () => {
    if (!subject || !message) {
      return toast.error("Please fill in both subject and message");
    }
    
    setSending(true);
    try {
      const email = `${lead.contact.toLowerCase().replace(" ", ".")}@${lead.company.split(" ")[0].toLowerCase()}.com`;
      
      // Call our Supabase Edge Function to send the email via Resend
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { to: email, subject, message, leadName: lead.contact }
      });
      
      if (error) throw new Error("Failed to send email");
      
      toast.success("Email sent successfully!");
      setSubject("");
      setMessage("");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };
>>>>>>> 2b5d6ca (update 3)

  return (
    <div>
      <PageHeader
        title={lead.company_name}
        breadcrumbs={[{ label: "CRM" }, { label: "Leads", to: "/crm/leads" }, { label: lead.company_name }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" />Back</Button>
            <Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-1.5" />Edit</Button>
            <Button size="sm" onClick={() => nav("/crm/convert")}><UserCheck className="h-4 w-4 mr-1.5" />Convert</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Section title="Overview">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-muted-foreground mb-1">Lead ID</dt><dd className="font-mono text-xs">{lead.id}</dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">Stage</dt><dd><StatusBadge status={lead.stage} /></dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">Product of Interest</dt><dd>{lead.interested_product || "-"}</dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">Owner</dt><dd>{ownerName}</dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">Country</dt><dd>{lead.country || "-"}</dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">Created</dt><dd>{format(new Date(lead.created_at), "PP")}</dd></div>
            </dl>
          </Section>
          <Section title="Recent Activity">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No activities recorded yet.</p>
            ) : (
              <ol className="relative border-l border-border ml-2 space-y-4">
                {activities.map((a) => (
                  <li key={a.id} className="ml-4">
                    <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary border-4 border-background" />
                    <div className={`text-sm font-medium ${a.completed ? "line-through text-muted-foreground" : ""}`}>{a.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.profiles?.full_name || "System"} · {a.type.replace("_", " ")} · {format(new Date(a.created_at), "PPp")}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Section>
        </div>
        <div className="space-y-4">
          <Section title="Contact">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" />{lead.contact_name || "-"}</div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {lead.contact_name ? `${lead.contact_name.toLowerCase().replace(/\s+/g, ".")}@${lead.company_name.split(" ")[0].toLowerCase()}.com` : "-"}
              </div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />Not Provided</div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />Last updated {format(new Date(lead.updated_at || lead.created_at), "PP")}</div>
            </div>
          </Section>
          <Section title="Interest">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Package className="h-5 w-5 text-muted-foreground" />
              {lead.interested_product || "No Product Specified"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Primary product interest</div>
          </Section>
          <Section title="Send Email">
            <div className="space-y-3">
              <Input 
                placeholder="Subject" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={sending}
              />
              <Textarea 
                placeholder="Type your message here..." 
                className="min-h-[120px]" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sending}
              />
              <Button className="w-full" onClick={handleSendEmail} disabled={sending}>
                {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                {sending ? "Sending..." : "Send to BDE Lead"}
              </Button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
