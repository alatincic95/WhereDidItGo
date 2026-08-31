import { StateCreator } from 'zustand';
import { StoreState } from '../useExpenseStore';
import { uuidv4 } from '../utils';
import { fetchHoldingsMarketData, getVsCurrency } from '../../utils/cryptoApi';

export interface CryptoHolding {
  id: string;
  coinId: string; // CoinGecko ID e.g. 'bitcoin'
  symbol: string; // e.g. 'BTC'
  name: string; // e.g. 'Bitcoin'
  amount: number; // how many coins the user holds
  createdAt: string;
}

export interface CryptoPriceCache {
  [coinId: string]: {
    price: number;
    change24h: number;
    change7d: number;
    sparkline?: number[];
  };
}

export interface CryptoSlice {
  cryptoHoldings: CryptoHolding[];
  cryptoPrices: CryptoPriceCache;
  cryptoLastFetched: string | null; // ISO timestamp
  cryptoIncludeInBalance: boolean;

  addCryptoHolding: (holding: Omit<CryptoHolding, 'id' | 'createdAt'>) => void;
  updateCryptoHolding: (id: string, updates: Partial<Pick<CryptoHolding, 'amount'>>) => void;
  removeCryptoHolding: (id: string) => void;
  setCryptoPrices: (prices: CryptoPriceCache) => void;
  refreshCryptoPrices: () => Promise<void>;
  getCryptoPortfolioValue: () => number;
  toggleCryptoInBalance: () => void;
}

export const createCryptoSlice: StateCreator<StoreState, [], [], CryptoSlice> = (set, get) => ({
  cryptoHoldings: [],
  cryptoPrices: {},
  cryptoLastFetched: null,
  cryptoIncludeInBalance: false,

  addCryptoHolding: (holding) =>
    set((state) => ({
      cryptoHoldings: [
        { ...holding, id: uuidv4(), createdAt: new Date().toISOString() },
        ...state.cryptoHoldings,
      ],
    })),

  updateCryptoHolding: (id, updates) =>
    set((state) => ({
      cryptoHoldings: state.cryptoHoldings.map((h) =>
        h.id === id ? { ...h, ...updates } : h
      ),
    })),

  removeCryptoHolding: (id) =>
    set((state) => ({
      cryptoHoldings: state.cryptoHoldings.filter((h) => h.id !== id),
    })),

  setCryptoPrices: (prices) =>
    set({ cryptoPrices: prices, cryptoLastFetched: new Date().toISOString() }),

  refreshCryptoPrices: async () => {
    const { cryptoHoldings, currencySymbol } = get();
    if (cryptoHoldings.length === 0) return;
    const coinIds = [...new Set(cryptoHoldings.map((h) => h.coinId))];
    const vsCurrency = getVsCurrency(currencySymbol);
    const prices = await fetchHoldingsMarketData(coinIds, vsCurrency);
    set({ cryptoPrices: prices, cryptoLastFetched: new Date().toISOString() });
  },

  getCryptoPortfolioValue: () => {
    const { cryptoHoldings, cryptoPrices } = get();
    return cryptoHoldings.reduce((sum, h) => {
      const price = cryptoPrices[h.coinId]?.price || 0;
      return sum + h.amount * price;
    }, 0);
  },

  toggleCryptoInBalance: () =>
    set((state) => ({ cryptoIncludeInBalance: !state.cryptoIncludeInBalance })),
});
