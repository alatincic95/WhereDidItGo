import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useExpenseStore } from '../store/useExpenseStore';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { formatCurrency } from '../utils/currency';
import {
  searchCoins,
  POPULAR_COINS,
  CoinSearchResult,
  fetchTopCoins,
  fetchCoinChart,
  getVsCurrency,
  CoinMarketData,
} from '../utils/cryptoApi';
import { Dimensions } from 'react-native';
import { CryptoHolding } from '../store/slices/cryptoSlice';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ── Sparkline Chart ────────────────────────────────────────────────

const ALLOCATION_COLORS = ['#6C63FF', '#F7931A', '#627EEA', '#26A17B', '#E6007A', '#00D395', '#E84142', '#2775CA', '#BA9F33', '#8247E5', '#FF6B6B', '#14F195'];

const SparklineChart: React.FC<{
  data: number[];
  width: number;
  height: number;
  color: string;
}> = React.memo(({ data, width, height, color }) => {
  if (!data || data.length < 2) return null;

  // Sample down to fit width (each bar ~2px wide)
  const maxBars = Math.floor(width / 2);
  const step = Math.max(1, Math.floor(data.length / maxBars));
  const sampled: number[] = [];
  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i]);
  }

  const min = Math.min(...sampled);
  const max = Math.max(...sampled);
  const range = max - min || 1;

  return (
    <View style={{ width, height, flexDirection: 'row', alignItems: 'flex-end', gap: 0.5, opacity: 0.8 }}>
      {sampled.map((val, i) => {
        const barHeight = Math.max(1, ((val - min) / range) * height);
        return (
          <View
            key={i}
            style={{
              width: Math.max(1, (width / sampled.length) - 0.5),
              height: barHeight,
              backgroundColor: color,
              borderRadius: 0.5,
            }}
          />
        );
      })}
    </View>
  );
});

// ── Allocation Bar ─────────────────────────────────────────────────

const AllocationBar: React.FC<{
  holdings: { symbol: string; value: number }[];
  totalValue: number;
  colors: any;
}> = React.memo(({ holdings, totalValue, colors }) => {
  if (holdings.length < 2 || totalValue <= 0) return null;

  const sorted = [...holdings].sort((a, b) => b.value - a.value);

  return (
    <View style={{ marginBottom: SPACING.lg }}>
      <Text style={{ fontSize: FONT_SIZE.xs, fontWeight: '700', letterSpacing: 1, color: colors.textMuted, marginBottom: SPACING.sm }}>
        ALLOCATION
      </Text>
      {/* Stacked bar */}
      <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden' }}>
        {sorted.map((h, i) => {
          const pct = (h.value / totalValue) * 100;
          if (pct < 0.5) return null;
          return (
            <View
              key={h.symbol}
              style={{
                width: `${pct}%` as any,
                height: 10,
                backgroundColor: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length],
              }}
            />
          );
        })}
      </View>
      {/* Legend */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginTop: SPACING.sm }}>
        {sorted.map((h, i) => {
          const pct = ((h.value / totalValue) * 100).toFixed(1);
          return (
            <View key={h.symbol} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length] }} />
              <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary, fontWeight: '600' }}>
                {h.symbol.toUpperCase()} {pct}%
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
});

// ── Line Chart ─────────────────────────────────────────────────────

const CHART_HEIGHT = 180;
const CHART_PADDING = 40; // left padding for Y axis labels
const TIME_RANGES = [
  { label: '24H', days: 1 },
  { label: '7D', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
] as const;

const LineChart: React.FC<{
  data: { timestamp: number; price: number }[];
  width: number;
  height: number;
  colors: any;
  formatCurrency: (n: number) => string;
}> = React.memo(({ data, width, height, colors, formatCurrency }) => {
  if (!data || data.length < 2) return null;

  const chartWidth = width - CHART_PADDING - SPACING.md;
  const prices = data.map((d) => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const isPositive = prices[prices.length - 1] >= prices[0];
  const lineColor = isPositive ? colors.success : colors.danger;

  // Sample to ~120 points max for performance
  const maxPoints = 120;
  const step = Math.max(1, Math.floor(data.length / maxPoints));
  const sampled: { x: number; y: number }[] = [];
  for (let i = 0; i < data.length; i += step) {
    sampled.push({
      x: (i / (data.length - 1)) * chartWidth,
      y: height - ((prices[i] - min) / range) * (height - 20),
    });
  }
  // Ensure last point is included
  if (sampled.length > 0 && sampled[sampled.length - 1].x < chartWidth) {
    sampled.push({
      x: chartWidth,
      y: height - ((prices[prices.length - 1] - min) / range) * (height - 20),
    });
  }

  // Y axis labels
  const yLabels = [max, (max + min) / 2, min];

  return (
    <View style={{ height, marginTop: SPACING.sm }}>
      {/* Y-axis labels */}
      {yLabels.map((val, i) => {
        const yPos = ((max - val) / range) * (height - 20);
        return (
          <View key={i} style={{ position: 'absolute', top: yPos - 6, left: 0 }}>
            <Text style={{ fontSize: 9, color: colors.textMuted, fontWeight: '600' }}>
              {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(val < 1 ? 4 : 2)}
            </Text>
          </View>
        );
      })}
      {/* Grid lines */}
      {yLabels.map((val, i) => {
        const yPos = ((max - val) / range) * (height - 20);
        return (
          <View
            key={`grid-${i}`}
            style={{
              position: 'absolute',
              top: yPos,
              left: CHART_PADDING,
              width: chartWidth,
              height: 1,
              backgroundColor: `${colors.textMuted}15`,
            }}
          />
        );
      })}
      {/* Line segments */}
      <View style={{ position: 'absolute', left: CHART_PADDING, top: 0, width: chartWidth, height }}>
        {sampled.map((point, i) => {
          if (i === 0) return null;
          const prev = sampled[i - 1];
          const dx = point.x - prev.x;
          const dy = point.y - prev.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: prev.x,
                top: prev.y,
                width: length,
                height: 2,
                backgroundColor: lineColor,
                borderRadius: 1,
                transform: [{ rotate: `${angle}deg` }],
                transformOrigin: 'left center',
              }}
            />
          );
        })}
        {/* Current price dot */}
        {sampled.length > 0 && (
          <View
            style={{
              position: 'absolute',
              left: sampled[sampled.length - 1].x - 4,
              top: sampled[sampled.length - 1].y - 4,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: lineColor,
            }}
          />
        )}
      </View>
    </View>
  );
});

export const CryptoScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const {
    cryptoHoldings,
    cryptoPrices,
    cryptoLastFetched,
    cryptoIncludeInBalance,
    addCryptoHolding,
    updateCryptoHolding,
    removeCryptoHolding,
    refreshCryptoPrices,
    getCryptoPortfolioValue,
    toggleCryptoInBalance,
    currencySymbol,
  } = useExpenseStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHolding, setEditingHolding] = useState<CryptoHolding | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Chart state
  const [showChart, setShowChart] = useState(false);
  const [chartDays, setChartDays] = useState(7);
  const [chartData, setChartData] = useState<{ timestamp: number; price: number }[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  // Market data
  const [topCoins, setTopCoins] = useState<CoinMarketData[]>([]);
  const [showMarket, setShowMarket] = useState(false);

  useEffect(() => {
    if (cryptoHoldings.length > 0) {
      handleRefresh();
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError('');
    try {
      await refreshCryptoPrices();
    } catch (e: any) {
      setError('Failed to fetch prices. Try again later.');
    }
    setRefreshing(false);
  };

  const loadMarketData = async () => {
    setLoading(true);
    try {
      const vs = getVsCurrency(currencySymbol);
      const data = await fetchTopCoins(vs, 50);
      setTopCoins(data);
      setShowMarket(true);
    } catch {
      setError('Failed to load market data');
    }
    setLoading(false);
  };

  const buildSparklineChart = () => {
    // Build 7D chart from cached sparkline data (no API call needed)
    const holdingsWithSparkline = cryptoHoldings.filter(
      (h) => cryptoPrices[h.coinId]?.sparkline && cryptoPrices[h.coinId].sparkline!.length > 0
    );
    if (holdingsWithSparkline.length === 0) return [];

    const baseSparkline = cryptoPrices[holdingsWithSparkline[0].coinId].sparkline!;
    const len = baseSparkline.length;
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    return Array.from({ length: len }, (_, i) => {
      let totalValue = 0;
      cryptoHoldings.forEach((h) => {
        const sparkline = cryptoPrices[h.coinId]?.sparkline;
        if (sparkline && sparkline.length > 0) {
          const price = sparkline[Math.min(i, sparkline.length - 1)];
          totalValue += h.amount * price;
        }
      });
      return {
        timestamp: now - sevenDaysMs + (i / (len - 1)) * sevenDaysMs,
        price: totalValue,
      };
    });
  };

  const loadChart = async (days: number) => {
    if (cryptoHoldings.length === 0) return;
    setChartDays(days);
    setError('');

    // For 7D, use cached sparkline data (already fetched, no extra API call)
    if (days === 7) {
      const data = buildSparklineChart();
      if (data.length > 0) {
        setChartData(data);
        return;
      }
    }

    setChartLoading(true);
    try {
      const vs = getVsCurrency(currencySymbol);
      // Fetch chart data sequentially with delay to avoid rate limits
      const allCharts: { timestamp: number; price: number }[][] = [];
      for (let i = 0; i < cryptoHoldings.length; i++) {
        if (i > 0) await new Promise((r) => setTimeout(r, 1500));
        const chart = await fetchCoinChart(cryptoHoldings[i].coinId, vs, days);
        allCharts.push(chart);
      }
      // Build a combined portfolio value timeline
      if (allCharts.length > 0 && allCharts[0].length > 0) {
        const baseTimestamps = allCharts[0];
        const combined = baseTimestamps.map((point, i) => {
          let totalValue = 0;
          cryptoHoldings.forEach((h, hIdx) => {
            const chart = allCharts[hIdx];
            const dataPoint = chart[Math.min(i, chart.length - 1)];
            totalValue += h.amount * (dataPoint?.price || 0);
          });
          return { timestamp: point.timestamp, price: totalValue };
        });
        setChartData(combined);
      }
    } catch (e: any) {
      // If API fails, try falling back to sparkline for 7D-ish view
      if (days <= 7) {
        const fallback = buildSparklineChart();
        if (fallback.length > 0) {
          setChartData(fallback);
          setChartLoading(false);
          return;
        }
      }
      setError(e?.message || 'Failed to load chart data');
    }
    setChartLoading(false);
  };

  const handleToggleChart = () => {
    if (!showChart) {
      setShowChart(true);
      loadChart(chartDays);
    } else {
      setShowChart(false);
    }
  };

  const portfolioValue = getCryptoPortfolioValue();

  const lastFetchedLabel = cryptoLastFetched
    ? `Updated ${new Date(cryptoLastFetched).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Not yet fetched';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Crypto Portfolio</Text>
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          {cryptoHoldings.length > 0 && (
            <TouchableOpacity onPress={handleToggleChart} style={styles.headerBtn}>
              <MaterialIcons
                name={showChart ? 'show-chart' : 'show-chart'}
                size={24}
                color={showChart ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.headerBtn}>
            <MaterialIcons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Portfolio Summary Card */}
        <LinearGradient
          colors={isDark ? ['#1a1a3e', '#0f0f1a'] : ['#f0f0ff', '#e8e8f8']}
          style={[styles.summaryCard, { borderColor: `${colors.primary}20` }]}
        >
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Portfolio Value</Text>
          <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
            {formatCurrency(portfolioValue)}
          </Text>
          <Text style={[styles.summaryMeta, { color: colors.textMuted }]}>{lastFetchedLabel}</Text>

          <TouchableOpacity
            style={[styles.includeToggle, { backgroundColor: `${colors.primary}15` }]}
            onPress={toggleCryptoInBalance}
          >
            <MaterialIcons
              name={cryptoIncludeInBalance ? 'check-box' : 'check-box-outline-blank'}
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.includeText, { color: colors.textSecondary }]}>
              Include in overall balance
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Portfolio Chart */}
        {showChart && cryptoHoldings.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <View style={styles.chartHeader}>
              <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Portfolio Value</Text>
              {chartData.length > 1 && (
                <Text style={{
                  fontSize: FONT_SIZE.xs,
                  fontWeight: '600',
                  color: chartData[chartData.length - 1].price >= chartData[0].price ? colors.success : colors.danger,
                }}>
                  {((chartData[chartData.length - 1].price - chartData[0].price) / chartData[0].price * 100).toFixed(2)}%
                </Text>
              )}
            </View>
            {/* Time range selector */}
            <View style={styles.timeRangeRow}>
              {TIME_RANGES.map((r) => (
                <TouchableOpacity
                  key={r.label}
                  style={[
                    styles.timeRangeBtn,
                    { borderColor: colors.border },
                    chartDays === r.days && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => loadChart(r.days)}
                >
                  <Text style={[
                    styles.timeRangeText,
                    { color: colors.textMuted },
                    chartDays === r.days && { color: '#FFF' },
                  ]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {chartLoading ? (
              <View style={{ height: CHART_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : chartData.length > 1 ? (
              <LineChart
                data={chartData}
                width={SCREEN_WIDTH - SPACING.md * 4}
                height={CHART_HEIGHT}
                colors={colors}
                formatCurrency={formatCurrency}
              />
            ) : (
              <View style={{ height: CHART_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.textMuted, fontSize: FONT_SIZE.sm }}>No chart data</Text>
              </View>
            )}
          </View>
        )}

        {error ? (
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        ) : null}

        {/* Holdings List */}
        {cryptoHoldings.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="currency-bitcoin" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No holdings yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Add your crypto holdings to track their value alongside your finances
            </Text>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddModal(true)}
            >
              <MaterialIcons name="add" size={20} color="#FFF" />
              <Text style={styles.addBtnText}>Add Holding</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.holdingsList}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>YOUR HOLDINGS</Text>
            {cryptoHoldings.map((holding) => {
              const priceData = cryptoPrices[holding.coinId];
              const price = priceData?.price || 0;
              const value = holding.amount * price;
              const change24h = priceData?.change24h || 0;
              const isPositive = change24h >= 0;
              const sparkline = priceData?.sparkline;
              const sparkColor = isPositive ? colors.success : colors.danger;

              return (
                <TouchableOpacity
                  key={holding.id}
                  style={[styles.holdingCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
                  onPress={() => {
                    setEditingHolding(holding);
                    setShowEditModal(true);
                  }}
                >
                  <View style={styles.holdingLeft}>
                    <View style={[styles.coinIcon, { backgroundColor: `${colors.primary}15` }]}>
                      <Text style={[styles.coinSymbol, { color: colors.primary }]}>
                        {holding.symbol.toUpperCase().substring(0, 3)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.holdingName, { color: colors.textPrimary }]} numberOfLines={1}>{holding.name}</Text>
                      <Text style={[styles.holdingAmount, { color: colors.textMuted }]}>
                        {holding.amount} {holding.symbol.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  {sparkline && sparkline.length > 0 && (
                    <SparklineChart data={sparkline} width={64} height={32} color={sparkColor} />
                  )}
                  <View style={styles.holdingRight}>
                    <Text style={[styles.holdingValue, { color: colors.textPrimary }]}>
                      {formatCurrency(value)}
                    </Text>
                    {price > 0 && (
                      <View style={styles.changeRow}>
                        <MaterialIcons
                          name={isPositive ? 'arrow-drop-up' : 'arrow-drop-down'}
                          size={18}
                          color={isPositive ? colors.success : colors.danger}
                        />
                        <Text style={{ color: isPositive ? colors.success : colors.danger, fontSize: FONT_SIZE.xs, fontWeight: '600' }}>
                          {Math.abs(change24h).toFixed(2)}%
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Allocation Bar */}
        {cryptoHoldings.length >= 2 && portfolioValue > 0 && (
          <AllocationBar
            holdings={cryptoHoldings.map((h) => ({
              symbol: h.symbol,
              value: h.amount * (cryptoPrices[h.coinId]?.price || 0),
            }))}
            totalValue={portfolioValue}
            colors={colors}
          />
        )}

        {/* Market Overview Button */}
        <TouchableOpacity
          style={[styles.marketBtn, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
          onPress={loadMarketData}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <MaterialIcons name="show-chart" size={22} color={colors.primary} />
          )}
          <Text style={[styles.marketBtnText, { color: colors.textPrimary }]}>
            {showMarket ? 'Refresh Market Data' : 'Browse Top Coins'}
          </Text>
          <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Market Data */}
        {showMarket && topCoins.length > 0 && (
          <View style={styles.marketSection}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>TOP COINS</Text>
            {topCoins.map((coin) => {
              const isPositive = (coin.price_change_percentage_24h || 0) >= 0;
              return (
                <View
                  key={coin.id}
                  style={[styles.marketRow, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
                >
                  <View style={styles.marketLeft}>
                    <Text style={[styles.marketRank, { color: colors.textMuted }]}>#{coin.market_cap_rank}</Text>
                    {coin.image ? (
                      <Image source={{ uri: coin.image }} style={styles.marketImage} />
                    ) : (
                      <View style={[styles.coinIcon, { backgroundColor: `${colors.primary}15`, width: 28, height: 28 }]}>
                        <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700' }}>
                          {coin.symbol.toUpperCase().substring(0, 3)}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.marketName, { color: colors.textPrimary }]} numberOfLines={1}>{coin.name}</Text>
                      <Text style={[styles.marketSymbol, { color: colors.textMuted }]} numberOfLines={1}>{coin.symbol.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.holdingRight}>
                    <Text style={[styles.marketPrice, { color: colors.textPrimary }]}>
                      {formatCurrency(coin.current_price)}
                    </Text>
                    <View style={styles.changeRow}>
                      <MaterialIcons
                        name={isPositive ? 'arrow-drop-up' : 'arrow-drop-down'}
                        size={16}
                        color={isPositive ? colors.success : colors.danger}
                      />
                      <Text style={{ color: isPositive ? colors.success : colors.danger, fontSize: FONT_SIZE.xs, fontWeight: '600' }}>
                        {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add Holding Modal */}
      <AddHoldingModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(holding) => {
          addCryptoHolding(holding);
          setShowAddModal(false);
          // Refresh prices after adding
          setTimeout(() => refreshCryptoPrices().catch(() => {}), 300);
        }}
        colors={colors}
        isDark={isDark}
      />

      {/* Edit Holding Modal */}
      {editingHolding && (
        <EditHoldingModal
          visible={showEditModal}
          holding={editingHolding}
          onClose={() => { setShowEditModal(false); setEditingHolding(null); }}
          onUpdate={(amount) => {
            updateCryptoHolding(editingHolding.id, { amount });
            setShowEditModal(false);
            setEditingHolding(null);
          }}
          onDelete={() => {
            removeCryptoHolding(editingHolding.id);
            setShowEditModal(false);
            setEditingHolding(null);
          }}
          colors={colors}
          isDark={isDark}
          currencySymbol={currencySymbol}
          price={cryptoPrices[editingHolding.coinId]?.price || 0}
        />
      )}
    </View>
  );
};

// ── Add Holding Modal ──────────────────────────────────────────────

interface AddModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (holding: { coinId: string; symbol: string; name: string; amount: number }) => void;
  colors: any;
  isDark: boolean;
}

const AddHoldingModal: React.FC<AddModalProps> = ({ visible, onClose, onAdd, colors, isDark }) => {
  const [step, setStep] = useState<'select' | 'amount'>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CoinSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<{ id: string; symbol: string; name: string } | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const reset = () => {
    setStep('select');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedCoin(null);
    setAmount('');
    setError('');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchCoins(query);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 400);
  };

  const handleSelectCoin = (coin: { id: string; symbol: string; name: string }) => {
    setSelectedCoin(coin);
    setStep('amount');
  };

  const handleConfirm = () => {
    if (!selectedCoin) return;
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setError('Enter a valid amount');
      return;
    }
    onAdd({ coinId: selectedCoin.id, symbol: selectedCoin.symbol, name: selectedCoin.name, amount: val });
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.modalOverlay]}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                    {step === 'select' ? 'Select Coin' : `Add ${selectedCoin?.symbol.toUpperCase()}`}
                  </Text>
                <TouchableOpacity onPress={() => { onClose(); reset(); }}>
                  <MaterialIcons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

          {step === 'select' ? (
            <>
              <TextInput
                style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="Search coins..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus
              />

              {searching && <ActivityIndicator style={{ marginVertical: 12 }} color={colors.primary} />}

              {searchQuery.length < 2 ? (
                <>
                  <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>POPULAR</Text>
                  <FlatList
                    data={POPULAR_COINS}
                    keyExtractor={(item) => item.id}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.coinListItem, { borderColor: colors.border }]}
                        onPress={() => handleSelectCoin(item)}
                      >
                        <View style={[styles.coinIcon, { backgroundColor: `${colors.primary}15` }]}>
                          <Text style={[styles.coinSymbol, { color: colors.primary }]}>
                            {item.symbol.substring(0, 3)}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.coinListName, { color: colors.textPrimary }]}>{item.name}</Text>
                          <Text style={[styles.coinListSymbol, { color: colors.textMuted }]}>{item.symbol}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  />
                </>
              ) : (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  keyboardShouldPersistTaps="handled"
                  ListEmptyComponent={
                    !searching ? (
                      <Text style={[styles.emptySearch, { color: colors.textMuted }]}>No coins found</Text>
                    ) : null
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.coinListItem, { borderColor: colors.border }]}
                      onPress={() => handleSelectCoin({ id: item.id, symbol: item.symbol, name: item.name })}
                    >
                      {item.thumb ? (
                        <Image source={{ uri: item.thumb }} style={styles.coinThumb} />
                      ) : (
                        <View style={[styles.coinIcon, { backgroundColor: `${colors.primary}15` }]}>
                          <Text style={[styles.coinSymbol, { color: colors.primary }]}>
                            {item.symbol.substring(0, 3)}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.coinListName, { color: colors.textPrimary }]}>{item.name}</Text>
                        <Text style={[styles.coinListSymbol, { color: colors.textMuted }]}>
                          {item.symbol.toUpperCase()}
                          {item.market_cap_rank ? ` · #${item.market_cap_rank}` : ''}
                        </Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                />
              )}
            </>
          ) : (
            <View style={styles.amountStep}>
              <Text style={[styles.amountLabel, { color: colors.textMuted }]}>
                How much {selectedCoin?.symbol.toUpperCase()} do you hold?
              </Text>
              <TextInput
                style={[styles.amountInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                value={amount}
                onChangeText={(t) => { setAmount(t); setError(''); }}
                keyboardType="decimal-pad"
                autoFocus
              />
              {error ? <Text style={[styles.errorSmall, { color: colors.danger }]}>{error}</Text> : null}

              <View style={styles.amountActions}>
                <TouchableOpacity
                  style={[styles.backStepBtn, { borderColor: colors.border }]}
                  onPress={() => setStep('select')}
                >
                  <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmBtnText}>Add Holding</Text>
                </TouchableOpacity>
              </View>
              </View>
            )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Edit Holding Modal ─────────────────────────────────────────────

interface EditModalProps {
  visible: boolean;
  holding: CryptoHolding;
  onClose: () => void;
  onUpdate: (amount: number) => void;
  onDelete: () => void;
  colors: any;
  isDark: boolean;
  currencySymbol: string;
  price: number;
}

const EditHoldingModal: React.FC<EditModalProps> = ({ visible, holding, onClose, onUpdate, onDelete, colors, isDark, price }) => {
  const [amount, setAmount] = useState(holding.amount.toString());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setAmount(holding.amount.toString());
    setShowDeleteConfirm(false);
    setError('');
  }, [holding]);

  const handleSave = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setError('Enter a valid amount');
      return;
    }
    onUpdate(val);
  };

  const newValue = (parseFloat(amount) || 0) * price;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: colors.background, maxHeight: '50%' }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                    {holding.name} ({holding.symbol.toUpperCase()})
                  </Text>
                  <TouchableOpacity onPress={onClose}>
                    <MaterialIcons name="close" size={24} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.amountLabel, { color: colors.textMuted }]}>Amount held</Text>
          <TextInput
            style={[styles.amountInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            value={amount}
            onChangeText={(t) => { setAmount(t); setError(''); }}
            keyboardType="decimal-pad"
          />
          {price > 0 && (
            <Text style={[styles.previewValue, { color: colors.textMuted }]}>
              ≈ {formatCurrency(newValue)}
            </Text>
          )}
          {error ? <Text style={[styles.errorSmall, { color: colors.danger }]}>{error}</Text> : null}

          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.deleteBtn, { backgroundColor: `${colors.danger}15` }]}
              onPress={() => {
                if (showDeleteConfirm) {
                  onDelete();
                } else {
                  setShowDeleteConfirm(true);
                }
              }}
            >
              <MaterialIcons name="delete" size={18} color={colors.danger} />
              <Text style={{ color: colors.danger, fontWeight: '600' }}>
                {showDeleteConfirm ? 'Confirm Delete' : 'Delete'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.confirmBtnText}>Save</Text>
            </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  headerBtn: { padding: 4 },
  scroll: { flex: 1, paddingHorizontal: SPACING.md },

  // Summary
  summaryCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  summaryLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  summaryValue: { fontSize: 32, fontWeight: '800', marginVertical: SPACING.xs },
  summaryMeta: { fontSize: FONT_SIZE.xs, marginBottom: SPACING.md },
  includeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  includeText: { fontSize: FONT_SIZE.sm, fontWeight: '500' },

  // Chart
  chartCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  chartTitle: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  timeRangeRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  timeRangeBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
  },
  timeRangeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },

  // Error
  errorText: { textAlign: 'center', marginBottom: SPACING.md, fontSize: FONT_SIZE.sm },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginTop: SPACING.md },
  emptySubtitle: { fontSize: FONT_SIZE.sm, textAlign: 'center', marginTop: SPACING.xs, marginHorizontal: 32 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    marginTop: SPACING.lg,
  },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: FONT_SIZE.md },

  // Holdings
  holdingsList: { marginBottom: SPACING.lg },
  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  holdingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  holdingLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  holdingRight: { alignItems: 'flex-end', flexShrink: 0 },
  coinIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinSymbol: { fontSize: FONT_SIZE.xs, fontWeight: '800' },
  holdingName: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  holdingAmount: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  holdingValue: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  changeRow: { flexDirection: 'row', alignItems: 'center' },

  // Market
  marketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  marketBtnText: { flex: 1, fontSize: FONT_SIZE.md, fontWeight: '600' },
  marketSection: { marginBottom: SPACING.lg },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  marketLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  marketRank: { fontSize: FONT_SIZE.xs, width: 28, fontWeight: '600' },
  marketImage: { width: 28, height: 28, borderRadius: 14 },
  marketName: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  marketSymbol: { fontSize: FONT_SIZE.xs },
  marketPrice: { fontSize: FONT_SIZE.sm, fontWeight: '600' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: '800' },
  searchInput: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  coinListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 0.5,
  },
  coinThumb: { width: 40, height: 40, borderRadius: 20 },
  coinListName: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  coinListSymbol: { fontSize: FONT_SIZE.xs },
  emptySearch: { textAlign: 'center', paddingVertical: 24, fontSize: FONT_SIZE.sm },

  // Amount step
  amountStep: { paddingVertical: SPACING.md },
  amountLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600', marginBottom: SPACING.sm },
  amountInput: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  previewValue: { textAlign: 'center', marginTop: SPACING.sm, fontSize: FONT_SIZE.sm },
  errorSmall: { textAlign: 'center', marginTop: SPACING.xs, fontSize: FONT_SIZE.sm },
  amountActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  backStepBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  confirmBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  confirmBtnText: { color: '#FFF', fontWeight: '700', fontSize: FONT_SIZE.md },

  // Edit actions
  editActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
});
