import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section, FormGrid, FormRow } from "@/components/shared/FormShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function Settings() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Company state
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("inr");
  const [taxId, setTaxId] = useState("");
  const [timezone, setTimezone] = useState("ist");

  // Document Numbering State
  const [invPrefix, setInvPrefix] = useState("INV-");
  const [qtPrefix, setQtPrefix] = useState("QT-");
  const [soPrefix, setSoPrefix] = useState("SO-");
  const [shPrefix, setShPrefix] = useState("SH-");

  // Email Integration State
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [fromEmail, setFromEmail] = useState("");

  useEffect(() => {
    if (!profile?.company_id) return;
    const fetchCompany = async () => {
      const { data, error } = await supabase.from("companies").select("*").eq("id", profile.company_id).single();
      if (!error && data) {
        setName(data.name || "Shastika Global Impex Pvt Ltd");
        setCurrency(data.base_currency?.toLowerCase() || "inr");
        
        // Document Numbering Setup
        if (data.invoice_prefix !== undefined) setInvPrefix(data.invoice_prefix || "INV-");
        if (data.quotation_prefix !== undefined) setQtPrefix(data.quotation_prefix || "QT-");
        if (data.order_prefix !== undefined) setSoPrefix(data.order_prefix || "SO-");
        if (data.shipment_prefix !== undefined) setShPrefix(data.shipment_prefix || "SH-");

        // Email Setup
        if (data.smtp_host) setSmtpHost(data.smtp_host);
        if (data.smtp_port) setSmtpPort(data.smtp_port);
        if (data.smtp_user) setSmtpUser(data.smtp_user);
        if (data.from_email) setFromEmail(data.from_email);
      }
      setLoading(false);
    };
    fetchCompany();
  }, [profile?.company_id]);

  const handleSave = async () => {
    if (!profile?.company_id) return;
    setSaving(true);
    
    // Update company table in Supabase
    const updateData: any = {
      name,
      base_currency: currency.toUpperCase(),
      invoice_prefix: invPrefix,
      quotation_prefix: qtPrefix,
      order_prefix: soPrefix,
      shipment_prefix: shPrefix,
      smtp_host: smtpHost,
      smtp_port: smtpPort,
      smtp_user: smtpUser,
      from_email: fromEmail
    };
    if (smtpPass) {
      updateData.smtp_pass = smtpPass;
    }

    const { error } = await supabase.from("companies").update(updateData).eq("id", profile.company_id);
    
    setSaving(false);
    if (error) {
      toast.error("Error saving: " + error.message);
    } else {
      toast.success("Settings saved successfully!");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <PageHeader title="Settings" description="Workspace preferences" breadcrumbs={[{ label: "System" }, { label: "Settings" }]}
        actions={<Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>} />
      <div className="space-y-4 max-w-3xl">
        <Section title="Company">
          <FormGrid>
            <FormRow label="Company name"><Input value={name} onChange={e => setName(e.target.value)} /></FormRow>
            <FormRow label="Tax ID / GSTIN"><Input value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="e.g. 33ABCDE1234F1Z5" /></FormRow>
            <FormRow label="Default currency">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inr">INR</SelectItem>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="eur">EUR</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Timezone">
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ist">Asia/Kolkata</SelectItem>
                  <SelectItem value="utc">UTC</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
          </FormGrid>
        </Section>
        <Section title="Document Numbering">
          <FormGrid>
            <FormRow label="Invoice prefix"><Input value={invPrefix} onChange={e => setInvPrefix(e.target.value)} /></FormRow>
            <FormRow label="Quotation prefix"><Input value={qtPrefix} onChange={e => setQtPrefix(e.target.value)} /></FormRow>
            <FormRow label="Order prefix"><Input value={soPrefix} onChange={e => setSoPrefix(e.target.value)} /></FormRow>
            <FormRow label="Shipment prefix"><Input value={shPrefix} onChange={e => setShPrefix(e.target.value)} /></FormRow>
          </FormGrid>
        </Section>
        
        <Section title="Email Integration (SMTP)">
          <FormGrid>
            <FormRow label="SMTP Host"><Input value={smtpHost} onChange={e => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com" /></FormRow>
            <FormRow label="SMTP Port"><Input value={smtpPort} onChange={e => setSmtpPort(e.target.value)} placeholder="587" /></FormRow>
            <FormRow label="SMTP Username"><Input value={smtpUser} onChange={e => setSmtpUser(e.target.value)} placeholder="user@company.com" /></FormRow>
            <FormRow label="SMTP Password"><Input type="password" value={smtpPass} onChange={e => setSmtpPass(e.target.value)} placeholder="••••••••" /></FormRow>
            <FormRow label="From Email Address"><Input value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="noreply@company.com" /></FormRow>
          </FormGrid>
        </Section>
      </div>
    </div>
  );
}
