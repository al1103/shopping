import { create } from 'zustand';
import type { Platform } from '@/types/product';
type Filters = {
  platform: Platform | 'All';
  minReviews: number;
  maxPrice: number;
  view: 'table' | 'grid';
  savedIds: string[];
  savedOnly: boolean;
  setPlatform: (platform: Platform | 'All') => void;
  setMinReviews: (value: number) => void;
  setMaxPrice: (value: number) => void;
  setView: (view: 'table' | 'grid') => void;
  toggleSave: (id: string) => void;
  setSavedOnly: (value: boolean) => void;
  reset: () => void;
};
export const useFilters = create<Filters>((set) => ({
  platform: 'All',
  minReviews: 20,
  maxPrice: 3000000,
  view: 'table',
  savedIds: [],
  savedOnly: false,
  setPlatform: (platform) => set({ platform }),
  setMinReviews: (minReviews) => set({ minReviews }),
  setMaxPrice: (maxPrice) => set({ maxPrice }),
  setView: (view) => set({ view }),
  toggleSave: (id) =>
    set((s) => ({
      savedIds: s.savedIds.includes(id) ? s.savedIds.filter((v) => v !== id) : [...s.savedIds, id],
    })),
  setSavedOnly: (savedOnly) => set({ savedOnly }),
  reset: () => set({ platform: 'All', minReviews: 20, maxPrice: 3000000, savedOnly: false }),
}));
