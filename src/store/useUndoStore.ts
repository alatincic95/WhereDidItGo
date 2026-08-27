import { create } from 'zustand';

export type UndoEntityType = 'expense' | 'income' | 'budget' | 'goal';

interface UndoEntry {
  id: number;
  message: string;
  entityType: UndoEntityType;
  restore: () => void;
  expiresAt: number;
}

interface UndoState {
  current: UndoEntry | null;
  show: (entry: Omit<UndoEntry, 'id' | 'expiresAt'>) => void;
  undo: () => void;
  dismiss: () => void;
}

const UNDO_DURATION_MS = 5000;
let nextId = 1;

export const useUndoStore = create<UndoState>((set, get) => ({
  current: null,
  show: (entry) => {
    const id = nextId++;
    set({
      current: {
        id,
        ...entry,
        expiresAt: Date.now() + UNDO_DURATION_MS,
      },
    });
    setTimeout(() => {
      const cur = get().current;
      if (cur && cur.id === id) {
        set({ current: null });
      }
    }, UNDO_DURATION_MS);
  },
  undo: () => {
    const cur = get().current;
    if (!cur) return;
    cur.restore();
    set({ current: null });
  },
  dismiss: () => set({ current: null }),
}));
