import { useEffect, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";


type Lead = {
  id: string;
  date: string;
  business_category: string;
  company_name: string;
  product_type: string;
  country: string;
  mobile: string;
  email: string;
  website: string;
  stage: string;
  assigned_to: string | null;
  profiles?: { full_name: string };
};

const STAGES = ["New", "Contacted", "Negotiation", "Qualified", "Won", "Lost"];

const STAGE_COLORS: Record<string, string> = {
  new: "bg-slate-500",
  contacted: "bg-blue-500",
  negotiation: "bg-yellow-500",
  qualified: "bg-purple-500",
  won: "bg-green-500",
  lost: "bg-red-500",
  New: "bg-slate-500",
  Contacted: "bg-blue-500",
  Negotiation: "bg-yellow-500",
  Qualified: "bg-purple-500",
  Won: "bg-green-500",
  Lost: "bg-red-500",
};

export default function LeadsList() {
  const { roleSlugs } = useAuth();
  // Allow admin, manager and bde to edit lead stage
  const canEditStage = ["admin", "manager", "bde"].some((r) => roleSlugs.has(r));
  const nav = useNavigate();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [date, setDate] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [productType, setProductType] = useState("");
  const [country, setCountry] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Assignment state
  const [team, setTeam] = useState<any[]>([]);
  const [assignedTo, setAssignedTo] = useState("");

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          id, date, business_category, company_name, product_type, country, mobile, email, website, stage, assigned_to,
          profiles:assigned_to (full_name)
        `)
        .eq('company_id', (await supabase.from('profiles').select('company_id').eq('id', (await supabase.auth.getSession()).data.session?.user?.id).single()).data?.company_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data as unknown as Lead[]);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeam = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', session.user.id).single();
    if (!profile?.company_id) return;

    const { data: profiles } = await supabase.from('profiles').select('id, full_name').eq('company_id', profile.company_id);
    if (profiles) {
      setTeam(profiles);
      setAssignedTo(session.user.id);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchTeam();
    
    // Add realtime subscription for leads
    const channel = supabase
      .channel('leads-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'leads' },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const resetForm = () => {
    setDate("");
    setBusinessCategory("");
    setCompanyName("");
    setProductType("");
    setCountry("");
    setMobile("");
    setEmail("");
    setWebsite("");
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) {
      toast.error("Company name is required");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        throw new Error("You must be logged in to create a lead");
      }

      const { error } = await supabase.from("leads").insert({
        date: date || null,
        business_category: businessCategory,
        company_name: companyName,
        product_type: productType,
        country: country,
        mobile: mobile,
        email: email,
        website: website,
        stage: "New",
        assigned_to: assignedTo || userId,
        created_by: userId,
        company_id: (await supabase.from('profiles').select('company_id').eq('id', userId).single()).data?.company_id
      });

      if (error) throw error;

      toast.success("Lead created successfully");
      setIsDialogOpen(false);
      resetForm();
      fetchLeads();
    } catch (error: any) {
      toast.error(error.message || "Failed to create lead");
    } finally {
      setSubmitting(false);
    }
  };

  const convertToCustomer = async (lead: Lead) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const companyId = (await supabase.from("profiles").select("company_id").eq("id", session?.user?.id).single()).data?.company_id;

      if (!companyId) throw new Error("Could not identify your company");

      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .insert({
          company_id: companyId,
          name: lead.company_name,
          country: lead.country,
        })
        .select()
        .single();

      if (customerError) throw customerError;

      await supabase.from("leads").update({ stage: "Won" }).eq("id", lead.id);

      toast.success(`${lead.company_name} is now a registered Customer!`);
      fetchLeads();
    } catch (error: any) {
      toast.error(error.message || "Conversion failed");
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("leads").delete().eq("id", deleteId);
      if (error) throw error;
      toast.success("Lead deleted successfully");
      fetchLeads();
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Leads</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create New Lead</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddLead} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-2">

              {/* DATE */}
              <div className="space-y-2">
                <Label className="text-foreground">DATE *</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="bg-background border-input"
                />
              </div>

              {/* Business Category */}
              <div className="space-y-2">
                <Label className="text-foreground">Business Category *</Label>
                <Input
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  placeholder="Enter Business Category"
                  required
                  className="bg-background border-input"
                />
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <Label className="text-foreground">Company Name *</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter Company Name"
                  required
                  className="bg-background border-input"
                />
              </div>

              {/* Product Type */}
              <div className="space-y-2">
                <Label className="text-foreground">Product_Type *</Label>
                <Input
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  placeholder="Enter Product_Type"
                  className="bg-background border-input"
                />
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label className="text-foreground">Country *</Label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Enter Country"
                  className="bg-background border-input"
                />
              </div>

              {/* Mobile */}
              <div className="space-y-2">
                <Label className="text-foreground">Mobile *</Label>
                <Input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter Mobile Number"
                  className="bg-background border-input"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="text-foreground">Email *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Email Address"
                  className="bg-background border-input"
                />
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label className="text-foreground">Website</Label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="Enter Website"
                  className="bg-background border-input"
                />
              </div>

              {/* Submit */}
              <Button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-primary/90">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Lead
              </Button>

            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-foreground font-bold">Date</TableHead>
              <TableHead className="text-foreground font-bold">Company</TableHead>
              <TableHead className="text-foreground font-bold">Business Category</TableHead>
              <TableHead className="text-foreground font-bold">Product Type</TableHead>
              <TableHead className="text-foreground font-bold">Country</TableHead>
              <TableHead className="text-foreground font-bold">Mobile</TableHead>
              <TableHead className="text-foreground font-bold">Stage</TableHead>
              <TableHead className="text-foreground font-bold">Assigned To</TableHead>
              <TableHead className="text-right text-foreground font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto opacity-20" />
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground italic">
                  No leads found.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => nav(`/crm/leads/${lead.id}`)}
                >
                  <TableCell className="text-sm">{lead.date || "-"}</TableCell>
                  <TableCell className="font-bold text-foreground">{lead.company_name}</TableCell>
                  <TableCell className="text-sm">{lead.business_category || "-"}</TableCell>
                  <TableCell className="text-sm">{lead.product_type || "-"}</TableCell>
                  <TableCell className="text-sm">{lead.country || "-"}</TableCell>
                  <TableCell className="text-sm">{lead.mobile || "-"}</TableCell>
                  <TableCell>
<<<<<<< Updated upstream
                    {canEditStage ? (
                      <Select 
                        defaultValue={lead.stage} 
=======
                    {isAdmin ? (
                      <Select
                        defaultValue={lead.stage}
>>>>>>> Stashed changes
                        onValueChange={async (newStage) => {
                          try {
                            const { error } = await supabase.from("leads").update({ stage: newStage }).eq("id", lead.id);
                            if (error) throw error;
                            toast.success(`Lead moved to ${newStage}`);
                            fetchLeads();
                          } catch (err: any) {
                            toast.error(err.message || "Failed to update stage");
                          }
                        }}
                      >
                        <SelectTrigger className={`h-8 w-32 ${STAGE_COLORS[lead.stage?.toLowerCase()] || 'bg-slate-500'} text-white border-none font-bold`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STAGES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={`h-8 w-32 justify-center ${STAGE_COLORS[lead.stage?.toLowerCase()] || 'bg-slate-500'} text-white border-none font-bold`}>
                        {lead.stage}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {lead.profiles?.full_name || "Unassigned"}
                  </TableCell>
                  <TableCell className="text-right">
<<<<<<< Updated upstream
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-[10px] font-bold uppercase tracking-wider"
                          onClick={(e: MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            e.preventDefault();
                            nav("/quotations/create", { state: { lead: lead } });
                          }}
                        >
                          Quote
                        </Button>
                        {lead.stage === "won" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-[10px] font-bold uppercase tracking-wider border-emerald-500/50 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                          onClick={(e: MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            e.preventDefault();
                            convertToCustomer(lead);
                          }}
=======
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-[10px] font-bold uppercase tracking-wider"
                        onClick={(e) => { e.stopPropagation(); nav("/quotations/create", { state: { lead: lead } }); }}
                      >
                        Quote
                      </Button>
                      {lead.stage === "Won" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-[10px] font-bold uppercase tracking-wider border-emerald-500/50 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                          onClick={(e) => { e.stopPropagation(); convertToCustomer(lead); }}
>>>>>>> Stashed changes
                        >
                          Convert
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/10"
<<<<<<< Updated upstream
                        onClick={(e: MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          e.preventDefault();
                          confirmDelete(lead.id);
                        }}
=======
                        onClick={(e) => { e.stopPropagation(); confirmDelete(lead.id); }}
>>>>>>> Stashed changes
                      >
                        <Trash2 className="h-4 w-4 text-destructive opacity-50 hover:opacity-100" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Lead"
        description="Are you sure you want to delete this lead? This action cannot be undone."
        onConfirm={executeDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setDeleteId(null);
        }}
      />
    </div>
  );
}