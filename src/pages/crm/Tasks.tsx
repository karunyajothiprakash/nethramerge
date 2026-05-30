import { useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import Card from "@/components/Card";
import { ClipboardList, Plus, Search, CheckCircle2, Circle, Clock, AlertTriangle, User, Tag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Tasks() {
  const [tasks, setTasks] = useState([
    { id: "T-102", title: "Follow up on Turmeric proposal", lead: "Future Wave Food Trading", bde: "Swathi", status: "In Progress", priority: "High", due: "Today" },
    { id: "T-105", title: "Prepare custom sample parcel", lead: "OrganicLife GmbH", bde: "Priya", status: "In Progress", priority: "Medium", due: "Tomorrow" },
    { id: "T-101", title: "Verify container freight quotes", lead: "Sea Horse Pvt Ltd", bde: "Rajesh", status: "Completed", priority: "High", due: "Completed" },
    { id: "T-108", title: "Draft commercial invoice contract", lead: "Greenfield Traders", bde: "Swathi", status: "To Do", priority: "Low", due: "June 2" },
    { id: "T-109", title: "Schedule Zoom negotiation call", lead: "Spice Kingdom LLC", bde: "Priya", status: "To Do", priority: "High", due: "June 3" }
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  const toggleComplete = (id: string) => {
    setTasks(prev =>
      prev.map(t => t.id === id ? { ...t, status: t.status === "Completed" ? "In Progress" : "Completed" } : t)
    );
  };

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.lead.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      <SectionHeader
        title="Tasks & Sales Workflows"
        sub="Monitor and assign daily sales tasks and follow-up activities for field executives"
        actions={
          <Button size="sm" className="btn-gold shadow-md">
            <Plus className="h-4 w-4 mr-1.5" /> Add Task
          </Button>
        }
      />

      {/* Kanban Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Active Tasks</div>
            <div className="text-2xl font-bold font-mono mt-0.5">{tasks.filter(t => t.status !== "Completed").length}</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">High Priority Tasks</div>
            <div className="text-2xl font-bold font-mono mt-0.5">{tasks.filter(t => t.priority === "High" && t.status !== "Completed").length}</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Completed Today</div>
            <div className="text-2xl font-bold font-mono mt-0.5">{tasks.filter(t => t.status === "Completed").length}</div>
          </div>
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-foreground">Task Board</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Assigned workflow queues for BDE teams</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks or clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-neutral-900 border border-border text-foreground focus:outline-hidden focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredTasks.map((t) => (
            <div
              key={t.id}
              className={`p-4 rounded-xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                t.status === "Completed"
                  ? "bg-neutral-900/20 border-border/40 opacity-60"
                  : "bg-neutral-900/40 border-border hover:border-primary/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleComplete(t.id)}
                  className="mt-0.5 text-muted-foreground hover:text-primary transition-colors focus:outline-hidden"
                >
                  {t.status === "Completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>
                <div className="space-y-1">
                  <div className={`text-xs font-bold leading-normal ${t.status === "Completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {t.title}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {t.lead}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Tag className="h-3 w-3" /> {t.id}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-primary">{t.bde} (BDE)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-auto">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                  t.priority === "High"
                    ? "bg-red-500/10 text-red-500 border border-red-500/20"
                    : t.priority === "Medium"
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                }`}>
                  {t.priority} Priority
                </span>

                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] ${
                  t.status === "Completed"
                    ? "bg-neutral-800 text-muted-foreground border border-neutral-700"
                    : t.due === "Today"
                    ? "bg-red-500/10 text-red-400 border border-red-500/10 animate-pulse"
                    : "bg-neutral-900 text-muted-foreground border border-border"
                }`}>
                  {t.due}
                </span>
              </div>
            </div>
          ))}
          {filteredTasks.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-xs">
              No tasks found matching your filter criteria.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
