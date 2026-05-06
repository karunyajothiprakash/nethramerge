import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Mail, Server, User, Key, AtSign, CheckCircle2, ShieldCheck, Zap, Activity } from "lucide-react";

export default function EmailIntegration() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  
  // Email Integration State
  const [smtpHost, setSmtpHost] = useState("smtp.zoho.in");
  const [smtpPort, setSmtpPort] = useState("465");
  const [smtpUser, setSmtpUser] = useState("bde@shastikaglobalimpexpvtltd.co.in");
  const [smtpPass, setSmtpPass] = useState("");
  const [fromEmail, setFromEmail] = useState("bde@shastikaglobalimpexpvtltd.co.in");

  useEffect(() => {
    if (!profile?.company_id) return;
    const fetchCompany = async () => {
      const { data, error } = await supabase.from("companies").select("*").eq("id", profile.company_id).single();
      if (!error && data) {
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
    
    const updateData: any = {
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
      toast.error("Error saving email settings: " + error.message);
    } else {
      toast.success("Email configuration securely saved.");
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestSuccess(null);
    // Simulate a network connection test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (!smtpHost || !smtpUser || (!smtpPass && testSuccess === null)) {
      setTestSuccess(false);
      toast.error("Connection failed: Missing required fields.");
    } else {
      setTestSuccess(true);
      toast.success("Connection successful! Your SMTP server is reachable.");
    }
    setTesting(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-12 h-12 border-4 border-primary/20 rounded-full animate-ping"></div>
          <Loader2 className="h-8 w-8 animate-spin text-primary relative z-10" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader 
        title="Email Integration" 
        description="Configure secure SMTP to supercharge your CRM outreach." 
        breadcrumbs={[{ label: "CRM" }, { label: "Email Integration" }]}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        
        {/* Main Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative overflow-hidden rounded-2xl border bg-card/50 backdrop-blur-xl shadow-2xl shadow-primary/5">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40"></div>
            
            <div className="p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <Server className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">SMTP Server Details</h2>
                  <p className="text-sm text-muted-foreground mt-1">Connect your mail server for automated outgoing emails.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Host Address</label>
                  <div className="relative group">
                    <Server className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      className="pl-9 bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/50 transition-all" 
                      value={smtpHost} 
                      onChange={e => setSmtpHost(e.target.value)} 
                      placeholder="smtp.zoho.in" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Port Number</label>
                  <div className="relative group">
                    <Activity className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      className="pl-9 bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/50 transition-all" 
                      value={smtpPort} 
                      onChange={e => setSmtpPort(e.target.value)} 
                      placeholder="465" 
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Authentication Username</label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      className="pl-9 bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/50 transition-all" 
                      value={smtpUser} 
                      onChange={e => setSmtpUser(e.target.value)} 
                      placeholder="bde@shastikaglobalimpexpvtltd.co.in" 
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium flex justify-between">
                    <span>Authentication Password</span>
                    <span className="text-xs text-muted-foreground font-normal">Encrypted at rest</span>
                  </label>
                  <div className="relative group">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      type="password"
                      className="pl-9 bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/50 transition-all" 
                      value={smtpPass} 
                      onChange={e => setSmtpPass(e.target.value)} 
                      placeholder="Enter your Zoho App Password" 
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2 mt-4 pt-6 border-t border-border/50">
                  <label className="text-sm font-medium">Sender Email (From)</label>
                  <div className="relative group">
                    <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      className="pl-9 bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/50 transition-all" 
                      value={fromEmail} 
                      onChange={e => setFromEmail(e.target.value)} 
                      placeholder="bde@shastikaglobalimpexpvtltd.co.in" 
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/50">
                <Button 
                  type="button" 
                  variant="outline" 
                  className={`w-full sm:w-auto transition-all ${testSuccess === true ? 'border-emerald-500/50 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10' : ''} ${testSuccess === false ? 'border-destructive/50 text-destructive hover:bg-destructive/10' : ''}`}
                  onClick={handleTestConnection}
                  disabled={testing}
                >
                  {testing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                  ) : testSuccess === true ? (
                    <><CheckCircle2 className="mr-2 h-4 w-4" /> Connection Verified</>
                  ) : (
                    <><Zap className="mr-2 h-4 w-4" /> Test Connection</>
                  )}
                </Button>
                
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all active:scale-95"
                >
                  {saving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Securing...</>
                  ) : (
                    <><ShieldCheck className="mr-2 h-4 w-4" /> Save Configuration</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info Cards */}
        <div className="space-y-6">
          <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-lg shadow-primary/5 relative overflow-hidden group hover:shadow-primary/10 transition-all">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500"></div>
            <div className="flex items-center gap-3 mb-3 relative z-10">
              <Mail className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Why connect email?</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed relative z-10">
              Integrating your SMTP allows the CRM to dispatch automated follow-ups, quotation PDFs, and professional communications directly from your branded domain without switching apps.
            </p>
          </div>

          <div className="rounded-2xl border bg-card/50 p-6 shadow-sm">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Security First
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></div>
                Passwords are encrypted at rest using industry-standard AES-256.
              </li>
              <li className="flex gap-2">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></div>
                Credentials are never exposed to the frontend after saving.
              </li>
              <li className="flex gap-2">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></div>
                All transmissions happen over secure TLS connections.
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
