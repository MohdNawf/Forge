import { createContext, useContext, type ReactNode } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";

type AuthValue = {
  user: { id: string } | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const loading = !isLoaded || !isUserLoaded;

  return (
    <AuthContext.Provider
      value={{
        user: clerkUser ? { id: clerkUser.id } : null,
        loading,
        signOut: async () => {
          await clerkSignOut();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
