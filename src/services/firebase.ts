/**
 * Firebase initialization + auth/firestore helpers.
 *
 * Reads config from `src/firebase-config.json` if present, with env-var
 * fallbacks (VITE_FIREBASE_*). If neither is configured, the app runs in
 * "demo mode" — auth/firestore calls degrade gracefully so the dashboard
 * is still usable for evaluation without a Firebase project.
 */

import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  type Firestore,
} from "firebase/firestore";

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

async function loadStaticConfig(): Promise<FirebaseConfig | null> {
  // Optional file: src/firebase-config.json. Vite resolves this lazily with
  // import.meta.glob so the project still type-checks when the file is absent.
  try {
    const modules = import.meta.glob("../firebase-config.json", {
      eager: false,
    }) as Record<string, () => Promise<{ default?: Partial<FirebaseConfig> }>>;
    const entry = Object.values(modules)[0];
    if (!entry) return null;
    const mod = await entry();
    const cfg = (mod.default ?? mod) as Partial<FirebaseConfig>;
    if (cfg.apiKey && cfg.projectId && cfg.appId && cfg.authDomain) {
      return cfg as FirebaseConfig;
    }
    return null;
  } catch {
    return null;
  }
}

function envConfig(): FirebaseConfig | null {
  const env = import.meta.env;
  if (
    env.VITE_FIREBASE_API_KEY &&
    env.VITE_FIREBASE_AUTH_DOMAIN &&
    env.VITE_FIREBASE_PROJECT_ID &&
    env.VITE_FIREBASE_APP_ID
  ) {
    return {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    };
  }
  return null;
}

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let initPromise: Promise<void> | null = null;

async function ensureInit(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const cfg = (await loadStaticConfig()) ?? envConfig();
    if (!cfg) return;
    app = initializeApp(cfg);
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
  })();
  return initPromise;
}

export async function isFirebaseConfigured(): Promise<boolean> {
  await ensureInit();
  return !!app;
}

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export type AuthListener = (user: AuthUser | null) => void;

export async function subscribeAuth(cb: AuthListener): Promise<() => void> {
  await ensureInit();
  if (!authInstance) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(authInstance, (u: User | null) => {
    cb(
      u
        ? {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
          }
        : null
    );
  });
}

export async function signInWithGoogle(): Promise<AuthUser> {
  await ensureInit();
  if (!authInstance || !dbInstance) {
    throw new Error(
      "Firebase is not configured. Add firebase-config.json or VITE_FIREBASE_* env vars."
    );
  }
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(authInstance, provider);
  const u = cred.user;
  // Mirror profile to /users/{uid}
  await setDoc(
    doc(dbInstance, "users", u.uid),
    {
      email: u.email,
      displayName: u.displayName,
      photoURL: u.photoURL,
      lastSeenAt: serverTimestamp(),
    },
    { merge: true }
  );
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
  };
}

export async function signOutCurrent(): Promise<void> {
  await ensureInit();
  if (!authInstance) return;
  await signOut(authInstance);
}

// ----- Saved Analyses -----

export interface SavedAnalysisInputs {
  ticker: string;
  spot: number;
  strike: number;
  daysToExpiry: number;
  volatility: number;
  riskFreeRate: number;
  type: "call" | "put";
}

export interface SavedAnalysisResult {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  breakEven: number;
}

export interface SavedAnalysis {
  id: string;
  createdAt: number;
  inputs: SavedAnalysisInputs;
  result: SavedAnalysisResult;
  insight?: string;
}

export async function saveAnalysis(
  uid: string,
  inputs: SavedAnalysisInputs,
  result: SavedAnalysisResult,
  insight?: string
): Promise<string> {
  await ensureInit();
  if (!dbInstance) throw new Error("Firestore not configured.");
  const col = collection(dbInstance, "users", uid, "savedAnalyses");
  const ref = await addDoc(col, {
    inputs,
    result,
    insight: insight ?? null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listAnalyses(uid: string): Promise<SavedAnalysis[]> {
  await ensureInit();
  if (!dbInstance) return [];
  const col = collection(dbInstance, "users", uid, "savedAnalyses");
  const snap = await getDocs(query(col, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => {
    const data = d.data() as {
      inputs: SavedAnalysisInputs;
      result: SavedAnalysisResult;
      insight?: string | null;
      createdAt?: { toMillis: () => number };
    };
    return {
      id: d.id,
      createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
      inputs: data.inputs,
      result: data.result,
      insight: data.insight ?? undefined,
    };
  });
}

export async function deleteAnalysis(uid: string, id: string): Promise<void> {
  await ensureInit();
  if (!dbInstance) return;
  await deleteDoc(doc(dbInstance, "users", uid, "savedAnalyses", id));
}
