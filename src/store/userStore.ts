import { create } from 'zustand';
import { User } from 'firebase/auth';

interface UserState {
  user: User | null;
  userData: any | null;
  setUser: (user: User | null) => void;
  setUserData: (data: any | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  userData: null,
  setUser: (user) => set({ user }),
  setUserData: (data) => set({ userData: data }),
  isLoading: true,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
