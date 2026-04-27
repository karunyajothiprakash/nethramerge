import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/FormShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { employees } from "@/data/mock";

const days = Array.from({ length: 14 }, (_, i) => i + 7);

export default function Attendance() {
  return (
    <div>
      <PageHeader title="Attendance" description="Past 14 days attendance log" breadcrumbs={[{ label: "Employees" }, { label: "Attendance" }]} />
      <Section>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left text-xs uppercase font-medium text-muted-foreground px-3 py-2">Employee</th>
              {days.map((d) => <th key={d} className="text-center text-xs font-medium text-muted-foreground px-1 py-2">{d}</th>)}
              <th className="text-right text-xs uppercase font-medium text-muted-foreground px-3 py-2">%</th>
            </tr></thead>
            <tbody>
              {employees.map((e) => {
                const present = days.map((d) => (d + e.id.charCodeAt(2)) % 7 !== 0 && (d + e.id.charCodeAt(2)) % 11 !== 0);
                const pct = Math.round(present.filter(Boolean).length / days.length * 100);
                return (
                  <tr key={e.id} className="border-b last:border-0 border-border">
                    <td className="px-3 py-2"><div className="text-sm font-medium">{e.name}</div><div className="text-xs text-muted-foreground">{e.department}</div></td>
                    {present.map((p, i) => <td key={i} className="text-center px-1 py-2"><span className={`inline-block h-2 w-2 rounded-full ${p ? "bg-success" : "bg-destructive/40"}`} /></td>)}
                    <td className="text-right px-3 py-2 tabular-nums font-medium">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
