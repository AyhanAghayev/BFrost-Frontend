import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/types";

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User) => void;
  setCurrentUser: (user: User | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      setAuth: (user) => set({ currentUser: user, isAuthenticated: true }),
      setCurrentUser: (user) =>
        set({ currentUser: user, isAuthenticated: user !== null }),
      clearAuth: () => set({ currentUser: null, isAuthenticated: false }),
    }),
    {
      name: "bfrost-auth",
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);