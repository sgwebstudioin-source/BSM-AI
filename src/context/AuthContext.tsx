import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  isFirebaseConfigured,
  signInWithGoogle,
  signOutCurrent,
  subscribeAuth,
  type AuthUser,
} from "../services/firebase";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  configured: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Allow demo browsing without Firebase. */
  enterDemo: () => void;
  demo: boolean;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const ok = await isFirebaseConfigured();
      setConfigured(ok);
      unsub = await subscribeAuth((u) => {
        setUser(u);
        setLoading(false);
      });
      if (!ok) setLoading(false);
    })();
    return () => {
      unsub?.();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      configured,
      demo,
      signIn: async () => {
        await signInWithGoogle();
      },
      signOut: async () => {
        await signOutCurrent();
        setDemo(false);
      },
      enterDemo: () => setDemo(true),
    }),
    [user, loading, configured, demo]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
