import { CURRENCY_OPTIONS } from './currency';

const BASE_URL = 'https://api.coingecko.com/api/v3';

export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  sparkline_in_7d?: { price: number[] };
}

export interface CoinSearchResult {
  id: string;
  symbol: string;
  name: string;
  thumb: string;
  large: string;
  market_cap_rank: number | null;
}

/** Map the app's currency symbol to a CoinGecko vs_currency code */
export const getVsCurrency = (currencySymbol: string): string => {
  const option = CURRENCY_OPTIONS.find((c) => c.symbol === currencySymbol);
  return (option?.code || 'USD').toLowerCase();
};

/** Fetch top coins by market cap */
export const fetchTopCoins = async (
  vsCurrency: string,
  count = 100,
): Promise<CoinMarketData[]> => {
  const res = await fetch(
    `${BASE_URL}/coins/markets?vs_currency=${vsCurrency}&order=market_cap_desc&per_page=${count}&page=1&sparkline=false&price_change_percentage=7d`,
  );
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  return res.json();
};

/** Fetch prices for specific coin IDs */
export const fetchCoinPrices = async (
  coinIds: string[],
  vsCurrency: string,
): Promise<Record<string, { price: number; change24h: number; change7d: number }>> => {
  if (coinIds.length === 0) return {};
  const ids = coinIds.join(',');
  const res = await fetch(
    `${BASE_URL}/simple/price?ids=${ids}&vs_currencies=${vsCurrency}&include_24hr_change=true&include_7d_change=true`,
  );
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  const data = await res.json();

  const result: Record<string, { price: number; change24h: number; change7d: number }> = {};
  for (const id of coinIds) {
    if (data[id]) {
      result[id] = {
        price: data[id][vsCurrency] || 0,
        change24h: data[id][`${vsCurrency}_24h_change`] || 0,
        change7d: data[id][`${vsCurrency}_7d_change`] || 0,
      };
    }
  }
  return result;
};

/** Fetch market data with sparkline for specific coin IDs (used for holdings) */
export const fetchHoldingsMarketData = async (
  coinIds: string[],
  vsCurrency: string,
): Promise<Record<string, { price: number; change24h: number; change7d: number; sparkline: number[] }>> => {
  if (coinIds.length === 0) return {};
  const ids = coinIds.join(',');
  const res = await fetch(
    `${BASE_URL}/coins/markets?vs_currency=${vsCurrency}&ids=${ids}&sparkline=true&price_change_percentage=7d`,
  );
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  const data: CoinMarketData[] = await res.json();

  const result: Record<string, { price: number; change24h: number; change7d: number; sparkline: number[] }> = {};
  for (const coin of data) {
    result[coin.id] = {
      price: coin.current_price || 0,
      change24h: coin.price_change_percentage_24h || 0,
      change7d: coin.price_change_percentage_7d_in_currency || 0,
      sparkline: coin.sparkline_in_7d?.price || [],
    };
  }
  return result;
};

/** Search coins by name/symbol */
export const searchCoins = async (query: string): Promise<CoinSearchResult[]> => {
  const res = await fetch(`${BASE_URL}/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  const data = await res.json();
  return (data.coins || []).slice(0, 20);
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fetch historical market chart data for a coin (with retry on 429) */
export const fetchCoinChart = async (
  coinId: string,
  vsCurrency: string,
  days: number,
): Promise<{ timestamp: number; price: number }[]> => {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await delay(2000 * attempt);
    const res = await fetch(
      `${BASE_URL}/coins/${coinId}/market_chart?vs_currency=${vsCurrency}&days=${days}`,
    );
    if (res.status === 429) continue;
    if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
    const data = await res.json();
    return (data.prices || []).map(([ts, price]: [number, number]) => ({ timestamp: ts, price }));
  }
  throw new Error('Rate limited — please wait a moment and try again');
};

/** Popular coins for quick-add */
export const POPULAR_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'tether', symbol: 'USDT', name: 'Tether' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
];
