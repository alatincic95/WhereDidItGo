import { StateCreator } from 'zustand';
import { StoreState } from '../useExpenseStore';

export interface AuthSlice {
  userId: string | null;
  userEmail: string | null;
  isSignedIn: boolean;
  authLoading: boolean;

  setAuthUser: (uid: string | null, email: string | null) => void;
  setAuthLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const createAuthSlice: StateCreator<StoreState, [], [], AuthSlice> = (set) => ({
  userId: null,
  userEmail: null,
  isSignedIn: false,
  authLoading: false,

  setAuthUser: (uid, email) =>
    set({
      userId: uid,
      userEmail: email,
      isSignedIn: uid !== null,
      authLoading: false,
    }),

  setAuthLoading: (loading) => set({ authLoading: loading }),

  clearAuth: () =>
    set({
      userId: null,
      userEmail: null,
      isSignedIn: false,
      authLoading: false,
    }),
});
