import { useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import Card from "@/components/Card";
import { TrendingUp, Award, Target, Star, BarChart3, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Performance() {
  const [bdes] = useState([
    { rank: 1, name: "Swathi Swathi", role: "Senior BDE", revenue: "$485,000", target: "$500,000", completion: "97%", deals: 8, calls: 87 },
    { rank: 2, name: "Priya Nair", role: "BDE", revenue: "$410,000", target: "$450,000", completion: "91%", deals: 6, calls: 72 },
    { rank: 3, name: "Rajesh Kumar", role: "BDE", revenue: "$320,000", target: "$400,000", completion: "80%", deals: 5, calls: 64 },
    { rank: 4, name: "Arjun Menon", role: "Junior BDE", revenue: "$145,000", target: "$300,000", completion: "48%", deals: 2, calls: 38 }
  ]);

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      <SectionHeader
        title="BDE Sales Performance & Leaderboards"
        sub="Monitor outbound deals closed, verify quota achievements, and audit BDE commissions"
        actions={
          <Button size="sm" className="btn-gold shadow-md">
            <Award className="h-4 w-4 mr-1.5" /> View Commissions
          </Button>
        }
      />

      {/* Target Progress metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Revenue Targeted</div>
            <div className="text-2xl font-bold font-mono mt-0.5">$1.65M</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Star className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Deals Acquired</div>
            <div className="text-2xl font-bold font-mono mt-0.5">21 Deals</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Avg Target Completion</div>
            <div className="text-2xl font-bold font-mono mt-0.5">79%</div>
          </div>
        </Card>
      </div>

      <Card className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Outbound Sales Leaderboard</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time target progression status for sales representatives</p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-900/60 text-muted-foreground font-semibold border-b border-border">
                <th className="p-3 w-14">Rank</th>
                <th className="p-3">Representative</th>
                <th className="p-3">Role</th>
                <th className="p-3">Revenue Secured</th>
                <th className="p-3">Monthly Target</th>
                <th className="p-3">Completion Ratio</th>
                <th className="p-3">Deals Closed</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bdes.map((b) => (
                <tr key={b.rank} className="border-b border-border/40 hover:bg-neutral-900/30 transition-colors">
                  <td className="p-3 font-bold font-mono text-primary text-sm">{b.rank}</td>
                  <td className="p-3 font-semibold text-foreground">{b.name}</td>
                  <td className="p-3 text-muted-foreground">{b.role}</td>
                  <td className="p-3 font-mono text-emerald-500 font-bold">{b.revenue}</td>
                  <td className="p-3 font-mono text-muted-foreground">{b.target}</td>
                  <td className="p-3 font-mono text-primary font-bold">{b.completion}</td>
                  <td className="p-3 font-mono text-muted-foreground">{b.deals} Deals</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" className="text-xs font-semibold">
                      Details <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
