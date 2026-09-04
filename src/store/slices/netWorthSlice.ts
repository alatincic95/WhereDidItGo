import { StateCreator } from 'zustand';
import { StoreState } from '../useExpenseStore';
import { uuidv4 } from '../utils';

export type NetWorthItemType = 'asset' | 'liability';
export type AssetCategory = 'cash' | 'investment' | 'property' | 'vehicle' | 'other_asset';
export type LiabilityCategory = 'mortgage' | 'student_loan' | 'car_loan' | 'credit_card' | 'personal_loan' | 'other_liability';

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  cash: 'Cash & Savings',
  investment: 'Investments',
  property: 'Property',
  vehicle: 'Vehicles',
  other_asset: 'Other',
};

export const LIABILITY_CATEGORY_LABELS: Record<LiabilityCategory, string> = {
  mortgage: 'Mortgage',
  student_loan: 'Student Loan',
  car_loan: 'Car Loan',
  credit_card: 'Credit Card',
  personal_loan: 'Personal Loan',
  other_liability: 'Other',
};

export const ASSET_CATEGORY_ICONS: Record<AssetCategory, string> = {
  cash: 'savings',
  investment: 'trending-up',
  property: 'home',
  vehicle: 'directions-car',
  other_asset: 'more-horiz',
};

export const LIABILITY_CATEGORY_ICONS: Record<LiabilityCategory, string> = {
  mortgage: 'home',
  student_loan: 'school',
  car_loan: 'directions-car',
  credit_card: 'credit-card',
  personal_loan: 'account-balance',
  other_liability: 'more-horiz',
};

export interface NetWorthItem {
  id: string;
  name: string;
  type: NetWorthItemType;
  category: AssetCategory | LiabilityCategory;
  value: number; // always positive; sign determined by type
  createdAt: string;
  updatedAt: string;
}

export interface NetWorthSnapshot {
  id?: string;
  month: string; // YYYY-MM
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  takenAt: string; // ISO date
}

export interface NetWorthSlice {
  netWorthItems: NetWorthItem[];
  netWorthSnapshots: NetWorthSnapshot[];

  addNetWorthItem: (item: Omit<NetWorthItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNetWorthItem: (id: string, updates: Partial<NetWorthItem>) => void;
  deleteNetWorthItem: (id: string) => void;
  takeNetWorthSnapshot: () => void;
  getNetWorth: () => { totalAssets: number; totalLiabilities: number; netWorth: number };
}

export const createNetWorthSlice: StateCreator<StoreState, [], [], NetWorthSlice> = (set, get) => ({
  netWorthItems: [],
  netWorthSnapshots: [],

  addNetWorthItem: (item) =>
    set((state) => ({
      netWorthItems: [
        ...state.netWorthItems,
        {
          ...item,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    })),

  updateNetWorthItem: (id, updates) =>
    set((state) => ({
      netWorthItems: state.netWorthItems.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
      ),
    })),

  deleteNetWorthItem: (id) =>
    set((state) => ({
      netWorthItems: state.netWorthItems.filter((item) => item.id !== id),
    })),

  takeNetWorthSnapshot: () => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const { totalAssets, totalLiabilities, netWorth } = get().getNetWorth();

    set((state) => {
      // Replace existing snapshot for this month or add new
      const filtered = state.netWorthSnapshots.filter((s) => s.month !== month);
      return {
        netWorthSnapshots: [
          ...filtered,
          { id: uuidv4(), month, totalAssets, totalLiabilities, netWorth, takenAt: now.toISOString() },
        ].sort((a, b) => a.month.localeCompare(b.month)),
      };
    });
  },

  getNetWorth: () => {
    const { netWorthItems, accounts, getAccountBalance, debts } = get();

    let totalAssets = 0;
    let totalLiabilities = 0;

    // Manual items
    netWorthItems.forEach((item) => {
      if (item.type === 'asset') totalAssets += item.value;
      else totalLiabilities += item.value;
    });

    // Auto-include account balances as assets/liabilities
    accounts.forEach((a) => {
      const bal = getAccountBalance(a.id);
      if (a.type === 'credit_card') {
        totalLiabilities += Math.abs(bal); // credit cards are debt
      } else if (bal >= 0) {
        totalAssets += bal;
      } else {
        totalLiabilities += Math.abs(bal);
      }
    });

    // Auto-include debts as liabilities
    debts.forEach((d) => {
      totalLiabilities += d.balance;
    });

    return { totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities };
  },
});
