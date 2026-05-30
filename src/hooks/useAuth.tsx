import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type ApprovalStatus = "pending" | "approved" | "rejected";

type Profile = {
  id: string;
  company_id: string | null;
  company_name?: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  status: ApprovalStatus;
  requested_role: string | null;
  rejection_reason: string | null;
  email_signature: string | null;
  phone: string | null;
};

type AuthCtx = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  permissions: Set<string>;
  roleSlugs: Set<string>;
  loading: boolean;
  onlineUsers: string[];
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [roleSlugs, setRoleSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const lastActivityRef = useRef<Date>(new Date());
  const currentSessionIdRef = useRef<string | null>(null);
  const [isIdle, setIsIdle] = useState(false);

  // Sync ref with state
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  const handleUserActivity = () => {
    lastActivityRef.current = new Date();
    if (isIdle) setIsIdle(false);
  };

  // Track activity separate from the main auth useEffect
  useEffect(() => {
    if (!session?.user) {
      console.log('Session tracking skipped: No user');
      return;
    }

    console.log('Starting session tracking interval...');

    const interval = setInterval(async () => {
      const now = new Date();
      const idleThreshold = 5 * 60 * 1000; // 5 minutes
      const idleTime = now.getTime() - lastActivityRef.current.getTime();
      const currentlyIdle = idleTime >= idleThreshold;
      
      setIsIdle(currentlyIdle);

      try {
        // Fetch current values to increment
        const { data: currentSess, error: fetchErr } = await (supabase
          .from('user_sessions' as any) as any)
          .select('active_minutes, idle_minutes')
          .eq('user_id', session.user.id)
          .is('logout_time', null)
          .maybeSingle();
          
        if (fetchErr) {
          console.error('Session timer: Error fetching current minutes', fetchErr);
          return;
        }

        if (currentSess) {
          const newActive = currentlyIdle ? (currentSess.active_minutes || 0) : (currentSess.active_minutes || 0) + 1;
          const newIdle = currentlyIdle ? (currentSess.idle_minutes || 0) + 1 : (currentSess.idle_minutes || 0);

          const updateData: any = {
            last_activity: now.toISOString(),
            active_minutes: newActive,
            idle_minutes: newIdle
          };
          
          console.log('Updating session...', newActive, newIdle);

          const { error: updateErr } = await (supabase
            .from('user_sessions' as any) as any)
            .update(updateData)
            .eq('user_id', session.user.id)
            .is('logout_time', null);

          if (updateErr) {
            console.error('Session timer: Error updating minutes', updateErr);
          }
        } else {
          console.log('Session timer pulse: No active session found to update for this user');
        }
      } catch (e) {
        console.error("Error in session tracking interval:", e);
      }
    }, 60000); // Every 1 minute

    // Activity listeners
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    return () => {
      console.log('Cleaning up session tracking interval...');
      clearInterval(interval);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
    };
  }, [session?.user]);


  const loadUserData = async (userId: string) => {
    // 1. Fetch Profile
    const { data: prof } = await supabase
      .from("profiles")
      .select("id, company_id, full_name, email, avatar_url, status, requested_role, rejection_reason, phone")
      .eq("id", userId)
      .maybeSingle();

    if (prof) {
      // 2. Fetch Company Name separately
      let companyName = null;
      if (prof.company_id) {
        const { data: comp } = await supabase
          .from("companies")
          .select("name")
          .eq("id", prof.company_id)
          .maybeSingle();
        companyName = comp?.name || null;
      }

      setProfile({
        ...(prof as Profile),
        company_name: companyName
      });
    } else {
      setProfile(null);
    }

    // 3. Fetch Roles & Permissions
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role_id, roles(slug, role_permissions(permissions(code)))")
      .eq("user_id", userId);
    const codes = new Set<string>();
    const slugs = new Set<string>();
    roles?.forEach((r: any) => {
      if (r.roles?.slug) slugs.add(r.roles.slug);
      r.roles?.role_permissions?.forEach((rp: any) => {
        if (rp.permissions?.code) codes.add(rp.permissions.code);
      });
    });
    setPermissions(codes);
    setRoleSlugs(slugs);
  };



  const startSession = async (user: User) => {
    if (typeof window === 'undefined') return;
    
    // First check if there's ALREADY a session with null logout_time to avoid duplicates
    const { data: existing } = await (supabase
      .from('user_sessions' as any) as any)
      .select('id')
      .eq('user_id', user.id)
      .is('logout_time', null)
      .maybeSingle();

    if (existing) {
      setCurrentSessionId(existing.id);
      return;
    }

    try {
      const { data, error } = await (supabase
        .from('user_sessions' as any) as any)
        .insert({
          user_id: user.id,
          email: user.email,
          login_time: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (!error && data) {
        setCurrentSessionId((data as any).id);
      }
    } catch (e) {
      console.error("Error starting session:", e);
    }
  };

  const endSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: loginRecord } = await (supabase
        .from('user_sessions' as any) as any)
        .select('*')
        .eq('user_id', user.id)
        .is('logout_time', null)
        .order('login_time', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (loginRecord) {
        const logoutTime = new Date();
        const loginTime = new Date(loginRecord.login_time);
        const durationMinutes = Math.round((logoutTime.getTime() - loginTime.getTime()) / 60000);

        await (supabase
          .from('user_sessions' as any) as any)
          .update({
            logout_time: logoutTime.toISOString(),
            duration_minutes: durationMinutes
          })
          .eq('id', loginRecord.id);
          
        setCurrentSessionId(null);
      }
    } catch (e) {
      console.error("Error ending session:", e);
    }
  };



  useEffect(() => {
    let userId: string | null = null;
    let profileSub: ReturnType<typeof supabase.channel> | null = null;
    let rolesSub: ReturnType<typeof supabase.channel> | null = null;
    let presenceChannel: ReturnType<typeof supabase.channel> | null = null;

    const subscribeRealtime = (uid: string) => {
      // Clean up previous channels using removeChannel to bypass the internal cache
      if (profileSub) supabase.removeChannel(profileSub);
      if (rolesSub) supabase.removeChannel(rolesSub);
      if (presenceChannel) supabase.removeChannel(presenceChannel);

      const rand = Math.random().toString(36).substring(7);

      // Listen to changes on this user's profile row
      profileSub = supabase
        .channel(`profile-${uid}-${rand}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles", filter: `id=eq.${uid}` },
          () => loadUserData(uid)
        )
        .subscribe();

      // Listen to changes on this user's roles
      rolesSub = supabase
        .channel(`user-roles-${uid}-${rand}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "user_roles", filter: `user_id=eq.${uid}` },
          () => loadUserData(uid)
        )
        .subscribe();

      // Realtime Presence for Online Status
      presenceChannel = supabase.channel(`online-users-${rand}`, {
        config: { presence: { key: uid } }
      });
      
      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel!.presenceState();
          setOnlineUsers(Object.keys(state));
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel!.track({ online_at: new Date().toISOString() });
          }
        });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((evt, sess) => {
      console.debug("supabase.onAuthStateChange", { evt, sess });
      setSession(sess);
      if (sess?.user) {
        userId = sess.user.id;
        setTimeout(() => loadUserData(sess.user.id), 0);
        subscribeRealtime(sess.user.id);
        
        // Track session login
        if (evt === 'SIGNED_IN' || evt === 'INITIAL_SESSION') {
          startSession(sess.user);
        }
      } else {
        userId = null;
        if (profileSub) supabase.removeChannel(profileSub);
        if (rolesSub) supabase.removeChannel(rolesSub);
        if (presenceChannel) supabase.removeChannel(presenceChannel);
        setProfile(null);
        setPermissions(new Set());
        setRoleSlugs(new Set());
        setOnlineUsers([]);
        
        if (evt === 'SIGNED_OUT') {
          endSession();
        }
      }
    });

    supabase.auth.getSession()
      .then(({ data: { session: sess } }) => {
        console.debug("supabase.getSession result", { sess });
        setSession(sess);
        if (sess?.user) {
          userId = sess.user.id;
          loadUserData(sess.user.id).finally(() => setLoading(false));
          subscribeRealtime(sess.user.id);
          startSession(sess.user);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("supabase.getSession error", err);
        setLoading(false);
      });

    return () => {
      subscription.unsubscribe();
      if (profileSub) supabase.removeChannel(profileSub);
      if (rolesSub) supabase.removeChannel(rolesSub);
      if (presenceChannel) supabase.removeChannel(presenceChannel);
    };
  }, []);

  const refresh = async () => {
    if (session?.user) await loadUserData(session.user.id);
  };

  const signOut = async () => {
    await endSession();
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, profile, permissions, roleSlugs, loading, onlineUsers, signOut, refresh }}>
      {children}
    </Ctx.Provider>
  );
}


export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Fail-safe: avoid throwing during HMR/network blips — return a minimal fallback
    // eslint-disable-next-line no-console
    console.warn("useAuth used outside AuthProvider — returning fallback context");
    return {
      session: null,
      user: null,
      profile: null,
      permissions: new Set<string>(),
      roleSlugs: new Set<string>(),
      loading: true,
      onlineUsers: [],
      signOut: async () => {},
      refresh: async () => {},
    } as AuthCtx;
  }
  return ctx;
}

export function useCan() {
  const { permissions } = useAuth();
  return (code: string) => permissions.has(code);
}

export function useIsAdminOrManager() {
  const { roleSlugs } = useAuth();
  const slugs = Array.from(roleSlugs).map(s => s.toLowerCase());
  return slugs.includes("admin") || slugs.includes("manager");
}

export function useCanManageApprovals() {
  const { roleSlugs } = useAuth();
  const slugs = Array.from(roleSlugs).map(s => s.toLowerCase());
  return slugs.includes("admin") || slugs.includes("manager") || slugs.includes("secretary");
}
