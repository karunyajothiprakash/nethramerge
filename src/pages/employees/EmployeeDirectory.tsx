import { Plus, Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { employees } from "@/data/mock";

export default function EmployeeDirectory() {
  return (
    <div>
      <PageHeader title="Employee Directory" description="All team members across departments" breadcrumbs={[{ label: "Employees" }]}
        actions={<Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Employee</Button>} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((e) => (
          <Section key={e.id}>
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-full bg-primary-muted text-primary flex items-center justify-center font-semibold">{e.name.split(" ").map(n => n[0]).join("")}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{e.name}</div>
                  <StatusBadge status={e.status} />
                </div>
                <div className="text-xs text-muted-foreground">{e.role} · {e.department}</div>
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-3 w-3" />{e.email}</div>
                  <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3 w-3" />{e.phone}</div>
                </div>
              </div>
            </div>
          </Section>
        ))}
      </div>
    </div>
  );
}
