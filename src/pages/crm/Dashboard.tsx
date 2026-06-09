import { useMemo } from "react";
import { Target, Bell, CheckCircle2, DollarSign, TrendingUp, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";

const COLORS = {
  bg: "#0a0c10",
  surface: "#111318",
  card: "#161b22",
  border: "#21262d",
  accent: "#00d4aa",
  accentDim: "#00d4aa22",
  blue: "#388bfd",
  blueDim: "#388bfd22",
  orange: "#f78166",
  orangeDim: "#f7816622",
  purple: "#bc8cff",
  purpleDim: "#bc8cff22",
  gold: "#e3b341",
  goldDim: "#e3b34122",
  red: "#ff7b72",
  green: "#3fb950",
  textPrimary: "#e6edf3",
  textSecondary: "#8b949e",
  textMuted: "#484f58",
};

const Badge = ({ label, color = COLORS.accent }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
    {label}
  </span>
);

const statusColor = (s) => {
  const map = {
    "New": COLORS.blue,
    "Qualified": COLORS.purple,
    "Negotiation": COLORS.gold,
    "Follow-Up": COLORS.orange,
    "Closed Won": COLORS.green,
    "closed_won": COLORS.green,
    "Closed Lost": COLORS.red,
    "closed_lost": COLORS.red,
    "Draft": COLORS.textSecondary,
    "Sent": COLORS.blue,
    "Approved": COLORS.green,
    "Online": COLORS.green,
    "Idle": COLORS.gold,
    "Offline": COLORS.textMuted
  };
  return map[s] || COLORS.textSecondary;
};

const Card = ({ children, style = {} }) => (
  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "16px 20px", ...style }}>
    {children}
  </div>
);

const MetricCard = ({ label, value, sub, color = COLORS.accent, icon, onClick }) => (
  <Card style={{ flex: 1, minWidth: 140, cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 4 }}>{sub}</div>}
      </div>
      {icon && <div style={{ opacity: 0.6 }}>{icon}</div>}
    </div>
  </Card>
);

const SectionHeader = ({ title, sub }) => (
  <div style={{ marginBottom: 20 }}>
    <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary }}>{title}</h2>
    {sub && <p style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>{sub}</p>}
  </div>
);

const ProgressBar = ({ value, max, color = COLORS.accent }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ width: "100%", background: COLORS.border, borderRadius: 4, height: 6, marginTop: 6 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.5s" }} />
    </div>
  );
};

function Dashboard() {
  // 1. Leads Query (Total, Closed Won, Status Breakdown)
  const { data: leads = [], isLoading: isLoadingLeads } = useQuery({
    queryKey: ["crm_dashboard_leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("stage").not('is_deleted', 'eq', true);
      if (error) throw error;
      return data || [];
    }
  });

  // 2. Activities & Follow-Ups Query
  const { data: activitiesData, isLoading: isLoadingActivities } = useQuery({
    queryKey: ["crm_dashboard_activities"],
    queryFn: async () => {
      const [{ data: activitiesList }, { data: recent }, { data: followUps }] = await Promise.all([
        supabase.from("activities").select("completed, due_date").limit(100),
        supabase.from("activities").select("type, title, created_at, leads(company_name)").order("created_at", { ascending: false }).limit(5),
        supabase.from("follow_ups").select("is_notified, follow_up_date").eq("is_notified", false)
      ]);
      
      return { 
        pending: (activitiesList || []).filter((a: any) => a.completed !== true),
        followUps: followUps || [],
        recent: recent || [] 
      };
    }
  });

  // 3. Quotations & Orders Query
  const { data: quotationsData, isLoading: isLoadingQuotations } = useQuery({
    queryKey: ["crm_dashboard_quotations"],
    queryFn: async () => {
      const [quotesRes, profilesRes, leadsRes, ordersRes] = await Promise.all([
        supabase.from("quotations").select("total_amount, amount, status, created_at, lead_id"),
        supabase.from("profiles").select("id, full_name"),
        supabase.from("leads").select("id, assigned_to").not('is_deleted', 'eq', true),
        supabase.from("export_orders").select("id, status")
      ]);

      return { 
        approved: quotesRes.data || [], 
        profiles: profilesRes.data || [],
        leads: leadsRes.data || [],
        orders: ordersRes.data || []
      };
    }
  });

  const isLoading = isLoadingLeads || isLoadingActivities || isLoadingQuotations;

  // --- Process Stats ---
  const totalLeads = leads.length;
  // Use export_orders as the source of truth for closed deals besides won leads
  const wonLeadsCount = leads.filter(l => ['won', 'closed_won', 'Closed Won', 'closed', 'Won'].includes(l.stage)).length;
  const closedOrdersCount = quotationsData?.orders?.length || 0;
  const closedWonLeads = Math.max(wonLeadsCount, closedOrdersCount);
  const conversionRate = totalLeads > 0 ? Math.round((closedWonLeads / totalLeads) * 100) : 0;

  const pendingActivitiesList = activitiesData?.pending || [];
  const pendingFollowUps = activitiesData?.followUps || [];
  const totalPending = pendingActivitiesList.length + pendingFollowUps.length;
  const now = new Date();
  const overdueActivities = pendingActivitiesList.filter(a => a.due_date && new Date(a.due_date) < now).length;

  const approvedQuotes = quotationsData?.approved || [];
  const totalRevenue = approvedQuotes.reduce((sum, q: any) => {
    // total_amount is often 0 in the current data, so we use amount as a reliable fallback
    const val = Number(q.total_amount) || Number(q.amount) || 0;
    return sum + val;
  }, 0);
  const revenueFormatted = totalRevenue >= 1000000 
    ? `$${(totalRevenue / 1000000).toFixed(2)}M` 
    : `$${(totalRevenue / 1000).toFixed(1)}K`;

  // --- Process Trend Chart (Last 6 Months) ---
  const trendData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      months.push({
        label: format(subMonths(startOfMonth(new Date()), i), "MMM"),
        date: subMonths(startOfMonth(new Date()), i),
        value: 0
      });
    }

    approvedQuotes.forEach((q: any) => {
      const qDate = parseISO(q.created_at);
      const qStart = startOfMonth(qDate);
      const monthIdx = months.findIndex(m => m.date.getTime() === qStart.getTime());
      if (monthIdx !== -1) {
        const val = Number(q.total_amount) || Number(q.amount) || 0;
        months[monthIdx].value += val;
      }
    });

    return months;
  }, [approvedQuotes]);

  const maxRevTrend = Math.max(...trendData.map(m => m.value), 1);

  // --- Process Status Breakdown ---
  const statusBreakdown = useMemo(() => {
    const counts: { [key: string]: number } = {};
    leads.forEach(l => {
      const s = l.stage || "Unknown";
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  // --- Process Employee Performance ---
  const performanceData = useMemo(() => {
    const perf: { [key: string]: number } = {};
    
    // Group approved quotations by assigned_to (via leads)
    quotationsData?.approved?.forEach((q: any) => {
      const lead = quotationsData.leads.find(l => l.id === q.lead_id);
      if (lead?.assigned_to) {
        // Find profile id by matching assigned_to (could be ID or Name)
        const profile = quotationsData.profiles.find(p => 
          p.id === lead.assigned_to || p.full_name === lead.assigned_to
        );
        
        const displayName = profile?.full_name || lead.assigned_to;
        const val = Number(q.total_amount) || Number(q.amount) || 0;
        perf[displayName] = (perf[displayName] || 0) + val;
      }
    });

    return Object.entries(perf)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [quotationsData]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px" }}>
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <SectionHeader title="CRM Dashboard" sub="Shastika Global Impex — Agri Export ERP Overview" />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <MetricCard label="Total Leads" value={totalLeads.toString()} sub="Aggregated from live data" color={COLORS.blue} icon={<Target size={22} color={COLORS.blue} />} onClick={() => window.location.href = "/crm/leads"} />
        <MetricCard label="Pending Follow-Ups" value={totalPending.toString()} sub={`${overdueActivities} overdue`} color={COLORS.orange} icon={<Bell size={22} color={COLORS.orange} />} onClick={() => window.location.href = "/crm/activities"} />
        <MetricCard label="Closed Deals" value={closedWonLeads.toString()} sub="Total Closed Won" color={COLORS.green} icon={<CheckCircle2 size={22} color={COLORS.green} />} onClick={() => window.location.href = "/crm/leads"} />
        <MetricCard label="Revenue (USD)" value={revenueFormatted} sub="Total approved quotations" color={COLORS.accent} icon={<DollarSign size={22} color={COLORS.accent} />} />
        <MetricCard label="Conversion Rate" value={`${conversionRate}%`} sub="Won vs Total Leads" color={COLORS.purple} icon={<TrendingUp size={22} color={COLORS.purple} />} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: COLORS.textSecondary }}>MONTHLY REVENUE TREND</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
            {trendData.map((m, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: "100%", background: i === trendData.length - 1 ? COLORS.accent : COLORS.blue + "55", borderRadius: "4px 4px 0 0", height: `${(m.value / maxRevTrend) * 90}px`, transition: "height 0.5s", position: "relative" }}>
                  {m.value > 0 && <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: COLORS.accent, whiteSpace: "nowrap", fontFamily: "JetBrains Mono, monospace" }}>${(m.value / 1000).toFixed(0)}K</div>}
                </div>
                <span style={{ fontSize: 10, color: COLORS.textMuted }}>{m.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: COLORS.textSecondary }}>LEAD STATUS BREAKDOWN</div>
          {statusBreakdown.length === 0 ? (
            <div style={{ fontSize: 12, color: COLORS.textMuted, py: 4 }}>No lead data available</div>
          ) : statusBreakdown.map(([status, count]) => {
            const color = statusColor(status);
            return (
              <div key={status} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: COLORS.textSecondary, textTransform: "capitalize" }}>{status.replace("_", " ")}</span>
                  <span style={{ color, fontFamily: "JetBrains Mono, monospace" }}>{count}</span>
                </div>
                <ProgressBar value={count} max={totalLeads} color={color} />
              </div>
            );
          })}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: COLORS.textSecondary }}>EMPLOYEE PERFORMANCE</div>
          {performanceData.length === 0 ? (
            <div style={{ fontSize: 12, color: COLORS.textMuted, py: 4 }}>No performance data available</div>
          ) : performanceData.map(([name, revenue]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: COLORS.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: COLORS.accent, flexShrink: 0 }}>
                {name.split(" ").map(n => n[0]).join("")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{name}</div>
                <ProgressBar value={revenue} max={Math.max(...performanceData.map(p => p[1]))} color={revenue > 0 ? COLORS.green : COLORS.orange} />
              </div>
              <span style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: COLORS.textSecondary, flexShrink: 0 }}>${(revenue / 1000).toFixed(0)}K</span>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: COLORS.textSecondary }}>RECENT ACTIVITY</div>
          {(activitiesData?.recent || []).length === 0 ? (
            <div style={{ fontSize: 12, color: COLORS.textMuted, py: 4 }}>No recent activity</div>
          ) : (activitiesData?.recent || []).map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "JetBrains Mono, monospace", minWidth: 52, paddingTop: 2 }}>
                {format(parseISO(a.created_at), "hh:mm a")}
              </span>
              <div style={{ flex: 1, borderLeft: `2px solid ${COLORS.border}`, paddingLeft: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 500, textTransform: "capitalize" }}>{a.type} - {(a.leads as any)?.company_name || "Internal"}</div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{a.title || "No notes provided"}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
