import { StateCreator } from 'zustand';
import { Account, AccountType, Transfer } from '../../types';
import { StoreState } from '../useExpenseStore';
import { uuidv4 } from '../utils';

export interface CreditCardInfo {
  owed: number;
  limit: number;
  available: number;
  utilization: number; // 0-100
}

export interface AccountSlice {
  accounts: Account[];
  transfers: Transfer[];
  selectedAccountId: string | null; // null = "All Accounts"

  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  setDefaultAccount: (id: string) => void;
  getDefaultAccount: () => Account | undefined;
  getAccountBalance: (accountId: string) => number;
  getCreditCardInfo: (accountId: string) => CreditCardInfo | null;
  setSelectedAccountId: (id: string | null) => void;

  addTransfer: (transfer: Omit<Transfer, 'id'>) => void;
  updateTransfer: (id: string, updates: Partial<Transfer>) => void;
  deleteTransfer: (id: string) => void;
  getTransfersByAccount: (accountId: string) => Transfer[];
}

export const DEFAULT_ACCOUNT: Account = {
  id: 'default-account',
  name: 'Default',
  type: 'bank',
  balance: 0,
  color: '#6C63FF',
  icon: 'account-balance',
  isDefault: true,
  createdAt: new Date().toISOString(),
};

export const createAccountSlice: StateCreator<StoreState, [], [], AccountSlice> = (set, get) => ({
  accounts: [DEFAULT_ACCOUNT],
  transfers: [],
  selectedAccountId: null,

  addAccount: (account) => {
    const now = new Date().toISOString();
    set((state) => ({
      accounts: [
        ...state.accounts,
        { ...account, id: uuidv4(), createdAt: now, updatedAt: now },
      ],
    }));
  },

  updateAccount: (id, updates) =>
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
      ),
    })),

  deleteAccount: (id) => {
    const { accounts } = get();
    const account = accounts.find((a) => a.id === id);
    if (!account || account.isDefault) return; // can't delete default

    const defaultAccount = accounts.find((a) => a.isDefault);
    if (!defaultAccount) return;

    // Move all transactions from deleted account to default
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
      expenses: state.expenses.map((e) =>
        e.accountId === id ? { ...e, accountId: defaultAccount.id } : e
      ),
      incomes: state.incomes.map((i) =>
        i.accountId === id ? { ...i, accountId: defaultAccount.id } : i
      ),
      transfers: state.transfers.filter((t) =>
        t.fromAccountId !== id && t.toAccountId !== id
      ),
    }));
  },

  setDefaultAccount: (id) =>
    set((state) => ({
      accounts: state.accounts.map((a) => ({
        ...a,
        isDefault: a.id === id,
      })),
    })),

  getDefaultAccount: () => {
    const { accounts } = get();
    return accounts.find((a) => a.isDefault) || accounts[0];
  },

  setSelectedAccountId: (id) => set({ selectedAccountId: id }),

  getCreditCardInfo: (accountId) => {
    const { accounts } = get();
    const account = accounts.find((a) => a.id === accountId);
    if (!account || account.type !== 'credit_card') return null;

    const bal = get().getAccountBalance(accountId);
    const owed = Math.abs(bal); // getAccountBalance returns negative for credit cards
    const limit = account.creditLimit || 0;
    const available = Math.max(0, limit - owed);
    const utilization = limit > 0 ? (owed / limit) * 100 : 0;
    return { owed, limit, available, utilization };
  },

  getAccountBalance: (accountId) => {
    const { accounts, expenses, incomes, transfers } = get();
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return 0;

    const isDefault = account.isDefault;
    const isCreditCard = account.type === 'credit_card';
    const convert = get().convertToBase;

    if (isCreditCard) {
      // Credit card: balance field = initial amount owed (usually 0)
      // Expenses INCREASE owed amount, payments (transfers TO card) DECREASE it
      let owed = account.balance; // initial owed

      // Expenses charged to this card increase what's owed
      expenses.forEach((e) => {
        if (e.isFixed) return;
        if (e.accountId === 'none') return;
        if (e.accountId === accountId) {
          owed += convert(e.amount, e.currency);
        }
      });

      // Transfers TO credit card = payments (reduce owed)
      // Transfers FROM credit card = refunds/cashback (increase owed... rare)
      transfers.forEach((t) => {
        if (t.toAccountId === accountId) {
          owed -= t.amount; // payment reduces owed
        }
        if (t.fromAccountId === accountId) {
          owed += t.amount; // refund from card increases owed
        }
      });

      // Return negative value (it's debt)
      return -Math.max(0, owed);
    }

    // Regular account (cash, bank, savings, investment, other)
    let balance = account.balance;

    // Add incomes for this account
    incomes.forEach((i) => {
      if (!i.accountId && !isDefault) return;
      if (i.accountId === 'none') return;
      if (i.accountId === accountId || (isDefault && !i.accountId)) {
        balance += i.amount;
      }
    });

    // Subtract expenses for this account
    expenses.forEach((e) => {
      if (e.isFixed) return;
      if (!e.accountId && !isDefault) return;
      if (e.accountId === 'none') return;
      if (e.accountId === accountId || (isDefault && !e.accountId)) {
        balance -= convert(e.amount, e.currency);
      }
    });

    // Process transfers
    transfers.forEach((t) => {
      if (t.fromAccountId === accountId) {
        balance -= t.amount;
      }
      if (t.toAccountId === accountId) {
        balance += t.amount;
      }
    });

    return balance;
  },

  addTransfer: (transfer) => {
    const now = new Date().toISOString();
    set((state) => ({
      transfers: [{ ...transfer, id: uuidv4(), createdAt: now, updatedAt: now }, ...state.transfers],
    }));
  },

  updateTransfer: (id, updates) =>
    set((state) => ({
      transfers: state.transfers.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ),
    })),

  deleteTransfer: (id) =>
    set((state) => ({
      transfers: state.transfers.filter((t) => t.id !== id),
    })),

  getTransfersByAccount: (accountId) => {
    const { transfers } = get();
    return transfers.filter(
      (t) => t.fromAccountId === accountId || t.toAccountId === accountId
    );
  },
});
