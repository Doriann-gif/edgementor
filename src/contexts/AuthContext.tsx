import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** True until the admin/mentor role check for the current user resolves.
   *  Role-gated pages must wait for this — redirecting while it's true
   *  bounces admins to the homepage on hard refresh. */
  rolesLoading: boolean;
  isAdmin: boolean;
  isMentor: boolean;
  /** The account has 2FA enrolled but the current session is still at aal1 —
   *  the second factor has not been satisfied. The app-wide MfaGate uses this
   *  to enforce the TOTP challenge on every entry path (OAuth, refresh), not
   *  just the email/password login. */
  mfaRequired: boolean;
  /** False until the first assurance-level check resolves, so the gate doesn't
   *  flash before we know whether a second factor is outstanding. */
  assuranceChecked: boolean;
  /** Re-read the session's assurance level (call after completing a challenge). */
  refreshAssurance: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  rolesLoading: true,
  isAdmin: false,
  isMentor: false,
  mfaRequired: false,
  assuranceChecked: false,
  refreshAssurance: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMentor, setIsMentor] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [assuranceChecked, setAssuranceChecked] = useState(false);

  const resetRoles = () => {
    setIsAdmin(false);
    setIsMentor(false);
    setRolesLoading(false);
  };

  // Whether the current session still owes a second factor. `nextLevel` is
  // aal2 only when a verified TOTP factor exists; `currentLevel` reaches aal2
  // once the challenge is passed. This is the single source of truth the
  // MfaGate reads, so OAuth and hard-refresh sessions are enforced too.
  const checkAssurance = async () => {
    try {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      setMfaRequired(data?.nextLevel === "aal2" && data.currentLevel !== "aal2");
    } catch {
      // Fail open on a transient read error rather than locking the user out of
      // an account that may not even have 2FA — the login paths still enforce it.
      setMfaRequired(false);
    } finally {
      setAssuranceChecked(true);
    }
  };

  const refreshAssurance = async () => {
    await checkAssurance();
  };

  const checkRoles = async (userId: string) => {
    setRolesLoading(true);
    try {
      const [adminRes, mentorRes] = await Promise.all([
        supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
        supabase.from("mentors").select("id").eq("user_id", userId).eq("status", "approved").maybeSingle(),
      ]);
      setIsAdmin(Boolean(adminRes.data));
      setIsMentor(Boolean(mentorRes.data));
      setRolesLoading(false);
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
        void checkAssurance();
      } else {
        resetRoles();
        setMfaRequired(false);
        setAssuranceChecked(true);
      }
    });

    void supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);

      if (currentSession?.user) {
        void checkRoles(currentSession.user.id);
        void checkAssurance();
      } else {
        resetRoles();
        setMfaRequired(false);
        setAssuranceChecked(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    resetRoles();
    setMfaRequired(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, rolesLoading, isAdmin, isMentor, mfaRequired, assuranceChecked, refreshAssurance, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
