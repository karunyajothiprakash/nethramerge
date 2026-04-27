import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Section, FormGrid, FormRow } from "@/components/shared/FormShell";
import { toast } from "sonner";

export default function CreateShipment() {
  const nav = useNavigate();
  return (
    <div>
      <PageHeader title="Create Shipment" breadcrumbs={[{ label: "Shipments", to: "/shipments" }, { label: "New" }]}
        actions={<>
          <Button variant="outline" size="sm" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" />Cancel</Button>
          <Button size="sm" onClick={() => { toast.success("Shipment created"); nav("/shipments"); }}><Save className="h-4 w-4 mr-1.5" />Save</Button>
        </>}
      />
      <div className="space-y-4 max-w-4xl">
        <Section title="Order Reference">
          <FormGrid>
            <FormRow label="Sales order" required><Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="so1">SO-2025-0089</SelectItem></SelectContent></Select></FormRow>
            <FormRow label="Carrier" required><Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="m">Maersk</SelectItem><SelectItem value="msc">MSC</SelectItem><SelectItem value="cma">CMA CGM</SelectItem></SelectContent></Select></FormRow>
          </FormGrid>
        </Section>
        <Section title="Route">
          <FormGrid>
            <FormRow label="Port of loading" required><Input placeholder="Mumbai (INMUN)" /></FormRow>
            <FormRow label="Port of discharge" required><Input placeholder="Hamburg (DEHAM)" /></FormRow>
            <FormRow label="Departure date"><Input type="date" /></FormRow>
            <FormRow label="ETA"><Input type="date" /></FormRow>
          </FormGrid>
        </Section>
        <Section title="Containers">
          <FormGrid>
            <FormRow label="Number of containers"><Input type="number" defaultValue={1} /></FormRow>
            <FormRow label="Container type"><Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="20">20ft Standard</SelectItem><SelectItem value="40">40ft Standard</SelectItem><SelectItem value="40hc">40ft High Cube</SelectItem></SelectContent></Select></FormRow>
          </FormGrid>
        </Section>
      </div>
    </div>
  );
}
