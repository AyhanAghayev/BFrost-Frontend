import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthState {
  currentUser: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setAccessToken: (token: string) => void;
  setCurrentUser: (user: User | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, token) =>
        set({ currentUser: user, accessToken: token, isAuthenticated: true }),
      setAccessToken: (token) =>
        set({ accessToken: token }),
      setCurrentUser: (user) =>
        set({ currentUser: user, isAuthenticated: user !== null }),
      clearAuth: () =>
        set({ currentUser: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: "bfrost-auth",
      partialize: (state) => ({
        currentUser: state.currentUser,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
