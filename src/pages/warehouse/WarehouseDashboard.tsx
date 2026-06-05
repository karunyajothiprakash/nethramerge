import React, { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import Card from "@/components/Card";
import {
    Boxes, PackageCheck, ClipboardList, Send,
    AlertTriangle, Container, Activity, BarChart3,
    TrendingDown, TrendingUp, FileText, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WarehouseDashboard() {
    const [loading, setLoading] = useState(false);

    // Mock data to scaffold the dashboard as strictly requested
    const metrics = [
        {
            title: "Current Inventory Status",
            value: "42,500 Kg",
            desc: "Total physical stock across all zones",
            icon: Boxes,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20"
        },
        {
            title: "Export Ready Stock",
            value: "14,200 Kg",
            desc: "Cleared QC and packed for shipping",
            icon: PackageCheck,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20"
        },
        {
            title: "Pending Packing Orders",
            value: "5 Orders",
            desc: "Currently awaiting warehouse processing",
            icon: ClipboardList,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20"
        },
        {
            title: "Shipment Dispatch Status",
            value: "2 Dispatched",
            desc: "Shipments left the warehouse today",
            icon: Send,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20"
        }
    ];

    return (
        <div className="p-6 space-y-6 animate-fade-in max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center">
                <PageHeader
                    title="Warehouse Operations Dashboard"
                    description="Live overview of stock, packing, and dispatch activities"
                    breadcrumbs={[{ label: "Warehouse" }, { label: "Dashboard" }]}
                />
                <Button className="btn-gold hidden sm:flex">
                    <Activity className="h-4 w-4 mr-2" />
                    Live Sync
                </Button>
            </div>

            {/* Top Value Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {metrics.map((m, idx) => (
                    <Card key={idx} className="p-6 bg-card/60 backdrop-blur-md border-border hover:border-white/10 transition-all group">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{m.title}</p>
                                <h3 className="text-2xl font-black text-foreground mt-2 tracking-tight">{m.value}</h3>
                            </div>
                            <div className={`p-3 rounded-xl ${m.bg} ${m.border} border group-hover:scale-110 transition-transform`}>
                                <m.icon className={`h-5 w-5 ${m.color}`} />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border/50">
                            <p className="text-xs text-muted-foreground">{m.desc}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column - Large Sections */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Container Loading Updates */}
                    <Card className="flex flex-col h-full bg-card/60 backdrop-blur-md border-border overflow-hidden">
                        <div className="p-5 border-b border-border flex justify-between items-center bg-black/20">
                            <div className="flex items-center gap-2">
                                <Container className="h-5 w-5 text-[#c8a84b]" />
                                <h3 className="font-bold text-foreground tracking-wide">Container Loading Updates</h3>
                            </div>
                            <span className="text-[10px] font-black uppercase text-muted-foreground bg-white/5 px-2 py-1 rounded">Live Feed</span>
                        </div>
                        <div className="p-5 flex-1">
                            <div className="space-y-4">
                                {[
                                    { truck: "TRK-9844", dest: "Nhava Sheva Port", status: "Loading (65%)", progress: 65, color: "bg-blue-500" },
                                    { truck: "TRK-2211", dest: "Chennai Port", status: "Completed", progress: 100, color: "bg-emerald-500" },
                                    { truck: "TRK-5502", dest: "Cochin Port", status: "Waiting at Dock", progress: 0, color: "bg-amber-500" }
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col gap-2 p-4 rounded-xl border border-white/5 bg-white/5">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="font-bold text-sm text-foreground">{item.truck}</span>
                                                <span className="text-xs text-muted-foreground ml-2">to {item.dest}</span>
                                            </div>
                                            <span className="text-xs font-semibold text-white/80">{item.status}</span>
                                        </div>
                                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                                            <div className={`h-full ${item.color}`} style={{ width: `${item.progress}%` }} />
                                        </div>
                                    </div>
                                ))}
                                <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-white mt-2">View All Loading Docks <ArrowRight className="h-3 w-3 ml-1" /></Button>
                            </div>
                        </div>
                    </Card>

                    {/* Daily Warehouse Activities */}
                    <Card className="bg-card/60 backdrop-blur-md border-border flex flex-col">
                        <div className="p-5 border-b border-border flex items-center gap-2 bg-black/20">
                            <Activity className="h-5 w-5 text-indigo-400" />
                            <h3 className="font-bold text-foreground tracking-wide">Daily Warehouse Activities</h3>
                        </div>
                        <div className="p-0">
                            <div className="divide-y divide-white/5">
                                {[
                                    { time: "10:45 AM", user: "Vikram S.", action: "Moved 500Kg Banana from Zone A to Zone C (QC Pending)" },
                                    { time: "09:30 AM", user: "John Doe", action: "Forklift maintenance completed in Dock 2" },
                                    { time: "08:15 AM", user: "Admin", action: "Approved Dispatch for EXP-2026-082" }
                                ].map((log, i) => (
                                    <div key={i} className="p-4 flex gap-4 hover:bg-white/5 transition-colors items-start">
                                        <div className="text-[10px] font-mono text-muted-foreground whitespace-nowrap pt-0.5">{log.time}</div>
                                        <div>
                                            <span className="text-xs font-bold text-white mb-0.5 block">{log.user}</span>
                                            <span className="text-sm text-muted-foreground">{log.action}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Low Stock Alerts */}
                    <Card className="bg-card/60 backdrop-blur-md border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)] overflow-hidden">
                        <div className="p-5 border-b border-red-500/10 flex justify-between items-center bg-red-500/5">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-400 animate-pulse" />
                                <h3 className="font-bold text-red-500 tracking-wide">Low Stock Alerts</h3>
                            </div>
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">2 Critical</span>
                        </div>
                        <div className="p-4 space-y-3">
                            {[
                                { product: "Premium Cardamom", current: "25 Kg", min: "50 Kg" },
                                { product: "Onion Large", current: "120 Kg", min: "500 Kg" }
                            ].map((alert, i) => (
                                <div key={i} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <div className="font-bold text-sm text-red-200">{alert.product}</div>
                                    <div className="flex justify-between mt-2 text-xs">
                                        <span className="text-red-400">Current: {alert.current}</span>
                                        <span className="text-red-400/60 font-mono">Min: {alert.min}</span>
                                    </div>
                                </div>
                            ))}
                            <Button className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 mt-2">
                                View Replenishment Plan
                            </Button>
                        </div>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="bg-card/60 backdrop-blur-md border-border p-5">
                        <h3 className="font-bold text-foreground tracking-wide mb-4 text-sm uppercase text-center text-muted-foreground border-b border-border/50 pb-2">Quick Warehouse Tools</h3>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <Button variant="outline" className="h-20 flex-col gap-2 border-white/10 hover:border-[#c8a84b] hover:text-[#c8a84b]">
                                <Boxes className="h-5 w-5" />
                                <span className="text-xs">Adjust Stock</span>
                            </Button>
                            <Button variant="outline" className="h-20 flex-col gap-2 border-white/10 hover:border-emerald-500 hover:text-emerald-500">
                                <PackageCheck className="h-5 w-5" />
                                <span className="text-xs">Verify QC</span>
                            </Button>
                            <Button variant="outline" className="h-20 flex-col gap-2 border-white/10 hover:border-blue-500 hover:text-blue-500">
                                <Container className="h-5 w-5" />
                                <span className="text-xs">Dock Mgmt</span>
                            </Button>
                            <Button variant="outline" className="h-20 flex-col gap-2 border-white/10 hover:border-purple-500 hover:text-purple-500">
                                <FileText className="h-5 w-5" />
                                <span className="text-xs">Print Labels</span>
                            </Button>
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
}
