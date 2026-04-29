import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosClient from '../services/axiosClient';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,

      setAuth: (user, token) => {
        localStorage.setItem('accessToken', token);
        set({ user, accessToken: token });
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null });
      },

      // Alias for components using clearAuth
      clearAuth: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null });
      },

      isAuthenticated: () => {
        return !!get().accessToken;
      },

      // Re-fetch user info from backend and update store
      fetchUser: async () => {
        try {
          const res = await axiosClient.get('/user/my-info');
          const userData = res.data?.result;
          if (userData) {
            set((state) => ({ user: { ...state.user, ...userData } }));
          }
        } catch (err) {
          console.error('fetchUser failed:', err);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    }
  )
);

export default useAuthStore;
