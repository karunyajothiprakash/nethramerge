import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/FormShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { Loader2, Fingerprint, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EsslUploader } from "./EsslUploader";

const past14Days = Array.from({ length: 14 }, (_, i) => {
  const d = subDays(new Date(), 13 - i);
  return format(d, 'yyyy-MM-dd');
});

export default function Attendance() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, any>>({});
  const [myTodayStatus, setMyTodayStatus] = useState<any>(null);
  const [punching, setPunching] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);

    // Fetch approved profiles
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, full_name, requested_role, company_id, biometric_id')
      .eq('status', 'approved')
      .order('full_name');

    if (profErr) {
      toast.error("Failed to load employees");
      setLoading(false);
      return;
    }

    setEmployees(profiles || []);
    
    const myProfile = profiles?.find(p => p.id === user?.id);
    if (myProfile?.company_id) setCompanyId(myProfile.company_id);

    // Fetch attendance logs
    const startDate = past14Days[0];
    const { data: logs, error: logsErr } = await supabase
      .from('attendance_logs')
      .select('*')
      .gte('date', startDate);

    if (!logsErr && logs) {
      const grouped: Record<string, any> = {};
      logs.forEach(log => {
        if (!grouped[log.employee_id]) grouped[log.employee_id] = {};
        grouped[log.employee_id][log.date] = log;
        
        // Check my status today
        if (log.employee_id === user?.id && log.date === format(new Date(), 'yyyy-MM-dd')) {
          setMyTodayStatus(log);
        }
      });
      setAttendanceData(grouped);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePunch = async () => {
    if (!userId || !companyId) return toast.error("User or Company ID missing");
    
    setPunching(true);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    try {
      if (!myTodayStatus) {
        // Punch In
        const { error } = await supabase.from('attendance_logs').insert({
          employee_id: userId,
          company_id: companyId,
          date: todayStr,
          status: 'present',
          clock_in: new Date().toISOString()
        });
        if (error) throw error;
        toast.success("Successfully Punched In!");
      } else if (!myTodayStatus.clock_out) {
        // Punch Out
        const { error } = await supabase.from('attendance_logs').update({
          clock_out: new Date().toISOString()
        }).eq('id', myTodayStatus.id);
        if (error) throw error;
        toast.success("Successfully Punched Out!");
      }
      await loadData(); // Reload
    } catch (e: any) {
      toast.error(e.message || "Failed to record attendance");
    } finally {
      setPunching(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in zoom-in duration-300">
      <PageHeader 
        title="Attendance" 
        description="Track team presence and punch in for the day" 
        breadcrumbs={[{ label: "Employees" }, { label: "Attendance" }]} 
        actions={<EsslUploader employees={employees} onUploadComplete={loadData} />}
      />
      
      


      {/* Live Team Presence (Today) Dashboard */}
      <div className="space-y-3 bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Team Presence (Today)
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time biometric punch status of employees for today</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading live status...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {employees.map((emp) => {
              const todayStr = format(new Date(), 'yyyy-MM-dd');
              const log = attendanceData[emp.id]?.[todayStr];
              
              let statusBadge = (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                  Not Synced
                </span>
              );
              
              if (log) {
                if (log.clock_out) {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      Punched Out
                    </span>
                  );
                } else if (log.clock_in) {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-pulse">
                      Punched In
                    </span>
                  );
                }
              }

              const initials = emp.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase() || "?";

              return (
                <div key={emp.id} className="bg-background hover:bg-muted/10 transition-all duration-300 p-4 rounded-lg border flex flex-col justify-between space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold truncate text-foreground">{emp.full_name}</h4>
                      <p className="text-[10px] text-muted-foreground truncate capitalize">
                        {emp.requested_role?.replace('_', ' ') || 'Employee'}
                        {emp.biometric_id && ` • Bio ID: ${emp.biometric_id}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-border/50 flex flex-col space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      {statusBadge}
                    </div>
                    {log?.clock_in && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">In:</span>
                        <span className="font-medium text-foreground">{format(new Date(log.clock_in), 'hh:mm a')}</span>
                      </div>
                    )}
                    {log?.clock_out && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Out:</span>
                        <span className="font-medium text-foreground">{format(new Date(log.clock_out), 'hh:mm a')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {employees.length === 0 && (
              <div className="col-span-full text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
                No employees available.
              </div>
            )}
          </div>
        )}
      </div>

      <Section>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading records...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left text-xs uppercase font-medium text-muted-foreground px-3 py-2">Employee</th>
                {past14Days.map((dateStr) => (
                  <th key={dateStr} className="text-center text-xs font-medium text-muted-foreground px-1 py-2">
                    {format(new Date(dateStr), 'dd')}
                  </th>
                ))}
                <th className="text-right text-xs uppercase font-medium text-muted-foreground px-3 py-2">%</th>
              </tr></thead>
              <tbody>
                {employees.map((e) => {
                  const empLogs = attendanceData[e.id] || {};
                  
                  let presentCount = 0;
                  const dayElements = past14Days.map(dateStr => {
                    const log = empLogs[dateStr];
                    const status = log?.status;
                    let color = "bg-muted"; 
                    
                    if (status === 'present') { color = "bg-success"; presentCount += 1; }
                    else if (status === 'absent') { color = "bg-destructive"; }
                    else if (status === 'half_day') { color = "bg-warning"; presentCount += 0.5; }
                    else if (status === 'on_leave') { color = "bg-info"; }

                    const clockInStr = log?.clock_in ? format(new Date(log.clock_in), 'hh:mm a') : '--:--';
                    const clockOutStr = log?.clock_out ? format(new Date(log.clock_out), 'hh:mm a') : '--:--';
                    const tooltip = status 
                      ? `${format(new Date(dateStr), 'MMM dd')} - ${status.toUpperCase()}\nIn: ${clockInStr}\nOut: ${clockOutStr}`
                      : `${format(new Date(dateStr), 'MMM dd')}: No Record`;

                    return (
                      <td key={dateStr} className="text-center px-1 py-2" title={tooltip}>
                        <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
                      </td>
                    );
                  });

                  const pct = Math.round((presentCount / 14) * 100);

                  return (
                    <tr key={e.id} className="border-b last:border-0 border-border hover:bg-muted/30">
                      <td className="px-3 py-2 min-w-[200px]">
                        <div className="text-sm font-medium">{e.full_name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground capitalize">{e.requested_role?.replace('_', ' ') || "Employee"}</div>
                      </td>
                      {dayElements}
                      <td className="text-right px-3 py-2 tabular-nums font-medium">{pct}%</td>
                    </tr>
                  );
                })}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={16} className="text-center py-8 text-muted-foreground">No approved employees found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Section>
    </div>
  );
}
