
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { X, Check, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";


type FollowUp = {
  id: string;
  company_name: string;
  contact_name?: string | null;
  follow_up_date: string;
  assigned_to: string;
  reminder_time: string;
};


export function FollowUpReminders() {
  const { profile, roleSlugs } = useAuth();
  const [reminders, setReminders] = useState<FollowUp[]>([]);
  const [hidden, setHidden] = useState(false);
  const [sessionDismissedIds, setSessionDismissedIds] = useState<Set<string>>(new Set());

  console.log("FollowUpReminders: profile=", profile, "roleSlugs=", Array.from(roleSlugs));

  const fetchReminders = async () => {
    if (!profile) return;

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHHMM = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    try {
      const { data, error } = await supabase
        .from("follow_ups")
        .select("id, company_name, contact_name, follow_up_date, assigned_to, reminder_time")
        .eq("follow_up_date", today)
        .eq("is_notified", false);

      if (error) throw error;
      
      if (data) {
        // Filter those where current time matches or has passed the reminder_time
        // AND not dismissed in current session
        const pending = (data as FollowUp[]).filter(r => {
          if (sessionDismissedIds.has(r.id)) return false;
          if (!r.reminder_time) return true; // Show immediately if no time set
          
          const [remH, remM] = r.reminder_time.split(':');
          const remHHMM = `${remH}:${remM}`;
          
          return currentHHMM >= remHHMM;
        });

        setReminders(pending);
      }
    } catch (error: any) {
      console.error("Error fetching reminders:", error.message);
    }
  };

  const markAsDone = async (id: string, company_name: string) => {
    try {
      const { error } = await supabase
        .from("follow_ups")
        .update({ is_notified: true })
        .eq("id", id);

      if (error) throw error;
      
      setReminders(prev => prev.filter(r => r.id !== id));
      toast.success(`Follow-up for ${company_name} marked as done`);
    } catch (error: any) {
      toast.error("Failed to update reminder: " + error.message);
    }
  };

  const handleDismiss = (id: string) => {
    setSessionDismissedIds(prev => new Set([...prev, id]));
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  useEffect(() => {
    if (profile) {
      fetchReminders();
      // Check every minute for precise time-based notifications
      const interval = setInterval(fetchReminders, 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [profile?.id, sessionDismissedIds]);

  if (!profile) return null;

  if (reminders.length === 0) return null;

  // If minimized, show only the bell icon badge at bottom-right
  if (hidden) {
    return (
      <button 
        onClick={() => setHidden(false)}
        className="fixed bottom-6 right-6 z-[9999] h-14 w-14 bg-amber-500 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all animate-in zoom-in"
      >
        <Bell className="h-6 w-6 text-white" />
        <div className="absolute -top-1 -right-1 bg-white text-amber-600 h-6 w-6 rounded-full flex items-center justify-center text-xs font-black border-2 border-amber-500 shadow-sm">
          {reminders.length}
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full group/stack">
      {/* Global Close Button (Minimize) at top-left of the entire stack */}
      <div className="relative w-full">
        <button 
          onClick={() => setHidden(true)}
          className="absolute -top-3 -left-3 h-7 w-7 rounded-full bg-[#1a1a1a] border border-gray-700 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-500/50 transition-all z-10 shadow-lg group"
          title="Minimize all"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col gap-3">
          {reminders.map((reminder) => (
            <div 
              key={reminder.id}
              className="bg-[#0a0a0a] border border-amber-500/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-5 animate-in fade-in slide-in-from-right-4 duration-500 backdrop-blur-md"
            >
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-3 shadow-[0_5px_15px_rgba(245,158,11,0.3)]">
                  <Bell className="h-5 w-5 text-black" />
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">Incoming Call Reminder</h4>
                    <p className="text-[13px] font-bold text-gray-100 tracking-tight leading-snug">
                      Remember to call <span className="text-amber-400">{reminder.company_name}</span> at {reminder.reminder_time ? (
                        new Date(`2000-01-01T${reminder.reminder_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                      ) : '09:00 AM'}
                    </p>
                  </div>
                  
                  {reminder.contact_name && (
                    <div className="bg-white/5 rounded-lg px-3 py-1.5 inline-flex items-center gap-2">
                       <span className="text-[10px] text-gray-500 font-bold uppercase">Contact</span>
                       <span className="text-[11px] text-amber-100 font-black tracking-wide">{reminder.contact_name}</span>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-1">
                    <Button 
                      size="sm" 
                      className="bg-amber-500 hover:bg-amber-600 text-black h-8 px-4 text-[9px] uppercase font-black tracking-widest shadow-lg shadow-amber-500/20 rounded-full transition-all"
                      onClick={() => markAsDone(reminder.id, reminder.company_name)}
                    >
                      <Check className="mr-1.5 h-3 w-3 stroke-[3]" /> Got it
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-8 px-4 text-[9px] uppercase font-black tracking-widest text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-all"
                      onClick={() => handleDismiss(reminder.id)}
                    >
                      <X className="mr-1.5 h-3 w-3" /> Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

