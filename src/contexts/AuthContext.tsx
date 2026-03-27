import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isMentor: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  isMentor: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMentor, setIsMentor] = useState(false);

  const resetRoles = () => {
    setIsAdmin(false);
    setIsMentor(false);
  };

  const checkRoles = async (userId: string) => {
    try {
      const [adminRes, mentorRes] = await Promise.all([
        supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
        supabase.from("mentors").select("id").eq("user_id", userId).eq("status", "approved").maybeSingle(),
      ]);
      setIsAdmin(Boolean(adminRes.data));
      setIsMentor(Boolean(mentorRes.data));
    } catch {
      resetRoles();
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);

      if (currentSession?.user) {
        void checkRoles(currentSession.user.id);
      } else {
        resetRoles();
      }
    });

    void supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);

      if (currentSession?.user) {
        void checkRoles(currentSession.user.id);
      } else {
        resetRoles();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    resetRoles();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isMentor, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
