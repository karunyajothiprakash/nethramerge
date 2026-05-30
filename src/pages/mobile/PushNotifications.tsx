import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import Card from "@/components/Card";
import { Bell, Send, CheckCircle, Smartphone, Flame, Calendar, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PushNotifications() {
  const [triggers, setTriggers] = useState([
    { id: "trig-1", title: "Lead Assigned Alert", description: "Notify BDE immediately when a high-value lead is assigned", active: true, icon: Smartphone },
    { id: "trig-2", title: "Urgent Follow-Up Reminder", description: "Send notification 15 minutes before a scheduled follow-up call", active: true, icon: Calendar },
    { id: "trig-3", title: "Hot Lead Temperature", description: "Notify team when a lead changes status to 'Negotiation'", active: false, icon: Flame },
    { id: "trig-4", title: "Monthly Target Milestones", description: "Congratulate and notify BDEs on reaching 50%, 80%, 100% of targets", active: true, icon: Target },
  ]);

  const [logs] = useState([
    { id: "N-9821", recipient: "Swathi Swathi", title: "High-Value Lead Assigned", body: "Future Wave Food Trading (UAE) has been assigned to you. Value: $85,000.", time: "10 mins ago", status: "Opened" },
    { id: "N-9815", recipient: "Rajesh Kumar", title: "Follow-Up Due", body: "Call with Marc Dupont (NaturalBest Co.) scheduled in 15 minutes.", time: "1 hour ago", status: "Delivered" },
    { id: "N-9799", recipient: "Priya Nair", title: "Status Alert: Qualified", body: "OrganicLife GmbH has been marked as Qualified. Action required.", time: "4 hours ago", status: "Opened" },
    { id: "N-9788", recipient: "Rajesh Kumar", title: "Milestone Reached!", body: "You have completed 80% of your monthly deal target. Keep pushing!", time: "1 day ago", status: "Delivered" }
  ]);

  const toggleTrigger = (id: string) => {
    setTriggers(prev =>
      prev.map(t => t.id === id ? { ...t, active: !t.active } : t)
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Push Notifications"
        description="Configure automated BDE push alerts and track delivery status in real-time"
        breadcrumbs={[{ label: "CRM", to: "/crm/dashboard" }, { label: "Push Notifications" }]}
        actions={
          <Button size="sm" className="btn-gold shadow-md">
            <Send className="h-4 w-4 mr-1.5" /> Send Custom Push
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Toggle switches for triggers */}
        <div className="lg:col-span-1 space-y-4">
          <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Automated Triggers</div>
          {triggers.map(t => {
            const IconComponent = t.icon;
            return (
              <Card key={t.id} className="p-4 flex items-start justify-between gap-3 hover:border-primary/20 transition-all duration-300">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-2 rounded-lg ${t.active ? "bg-primary/10 text-primary border border-primary/20" : "bg-neutral-900 text-muted-foreground border border-white/5"}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{t.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-normal">{t.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleTrigger(t.id)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-hidden ${t.active ? "bg-primary" : "bg-neutral-800"}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-black shadow-md transition-transform duration-200 ${t.active ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </Card>
            );
          })}
        </div>

        {/* Real-time Push Delivery Logs */}
        <Card className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">Real-Time Mobile Delivery Logs</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Live updates of outbound BDE notifications.
            </p>
          </div>

          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="p-4 rounded-lg bg-neutral-900/40 border border-white/5 flex items-start justify-between gap-4 hover:bg-neutral-900/60 transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-full bg-primary/5 text-primary border border-primary/10 mt-0.5 flex-shrink-0">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-foreground">{log.recipient}</span>
                      <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded-sm bg-neutral-800 border border-neutral-700">{log.id}</span>
                      <span className="text-[10px] text-muted-foreground">{log.time}</span>
                    </div>
                    <div className="text-xs font-bold text-primary-glow">{log.title}</div>
                    <p className="text-xs text-muted-foreground leading-normal truncate max-w-lg">{log.body}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                    log.status === "Opened"
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}>
                    <CheckCircle className="h-2.5 w-2.5" />
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
