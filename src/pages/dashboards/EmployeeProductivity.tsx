import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Section } from "@/components/shared/FormShell";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { employees } from "@/data/mock";

export default function EmployeeProductivity() {
  return (
    <div>
      <PageHeader title="Employee Productivity" description="Activity, attendance and performance" breadcrumbs={[{ label: "Dashboards" }, { label: "Employees" }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Employees" value="42" delta={{ value: "+3", positive: true }} />
        <StatCard label="Avg Attendance" value="94%" delta={{ value: "+1.2%", positive: true }} />
        <StatCard label="Tasks Completed" value="284" delta={{ value: "+38", positive: true }} hint="this week" />
        <StatCard label="Avg Response" value="2.4h" delta={{ value: "-12m", positive: true }} />
      </div>
      <Section title="Top Performers">
        <DataTable
          data={employees}
          searchKeys={["name", "department"]}
          columns={[
            { key: "name", header: "Employee", render: (r) => <div className="flex items-center gap-2"><div className="h-7 w-7 rounded-full bg-primary-muted text-primary flex items-center justify-center text-xs font-semibold">{r.name.split(" ").map(n=>n[0]).join("")}</div><span className="font-medium">{r.name}</span></div> },
            { key: "role", header: "Role", render: (r) => <span className="text-sm">{r.role}</span> },
            { key: "dept", header: "Department", render: (r) => <span className="text-sm text-muted-foreground">{r.department}</span> },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
      </Section>
    </div>
  );
}
