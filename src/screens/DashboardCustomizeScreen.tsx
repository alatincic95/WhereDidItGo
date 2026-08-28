import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../components/GlassCard';
import { useExpenseStore } from '../store/useExpenseStore';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import {
  DashboardCardConfig,
  DashboardCardId,
  DEFAULT_DASHBOARD_CARDS,
  DASHBOARD_CARD_LABELS,
  DASHBOARD_CARD_ICONS,
} from '../types';

export const DashboardCustomizeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const dashboardCards = useExpenseStore((s) => s.dashboardCards);
  const setDashboardCards = useExpenseStore((s) => s.setDashboardCards);
  const resetDashboardCards = useExpenseStore((s) => s.resetDashboardCards);

  // Ensure all card IDs are present (handles migration from older versions)
  const allIds: DashboardCardId[] = DEFAULT_DASHBOARD_CARDS.map((c) => c.id);
  const normalizedCards: DashboardCardConfig[] = allIds.map((id) => {
    const existing = dashboardCards.find((c) => c.id === id);
    return existing || { id, visible: true };
  });
  // Preserve custom order: cards in dashboardCards first (in their order), then any new ones
  const ordered: DashboardCardConfig[] = [
    ...dashboardCards.filter((c) => allIds.includes(c.id)),
    ...allIds.filter((id) => !dashboardCards.some((c) => c.id === id)).map((id) => ({ id, visible: true })),
  ];

  const [cards, setCards] = useState<DashboardCardConfig[]>(ordered);

  const handleToggle = (id: DashboardCardId) => {
    const updated = cards.map((c) =>
      c.id === id ? { ...c, visible: !c.visible } : c
    );
    setCards(updated);
    setDashboardCards(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= cards.length) return;
    const updated = [...cards];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setCards(updated);
    setDashboardCards(updated);
  };

  const handleReset = () => {
    setCards([...DEFAULT_DASHBOARD_CARDS]);
    resetDashboardCards();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Customize Dashboard
        </Text>
        <TouchableOpacity
          onPress={handleReset}
          style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <MaterialIcons name="restart-alt" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Toggle cards on or off and reorder them using the arrow buttons.
      </Text>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {cards.map((card, index) => (
          <GlassCard key={card.id} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.cardIcon, { backgroundColor: isDark ? 'rgba(108, 99, 255, 0.12)' : 'rgba(108, 99, 255, 0.08)' }]}>
                <MaterialIcons
                  name={DASHBOARD_CARD_ICONS[card.id] as any}
                  size={22}
                  color={card.visible ? colors.primary : colors.textMuted}
                />
              </View>
              <View style={styles.cardInfo}>
                <Text
                  style={[
                    styles.cardLabel,
                    { color: card.visible ? colors.textPrimary : colors.textMuted },
                  ]}
                >
                  {DASHBOARD_CARD_LABELS[card.id]}
                </Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => handleMove(index, 'up')}
                  disabled={index === 0}
                  style={[styles.arrowBtn, { opacity: index === 0 ? 0.3 : 1 }]}
                >
                  <MaterialIcons name="keyboard-arrow-up" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleMove(index, 'down')}
                  disabled={index === cards.length - 1}
                  style={[styles.arrowBtn, { opacity: index === cards.length - 1 ? 0.3 : 1 }]}
                >
                  <MaterialIcons name="keyboard-arrow-down" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
                <Switch
                  value={card.visible}
                  onValueChange={() => handleToggle(card.id)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>
            </View>
          </GlassCard>
        ))}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  card: {
    marginBottom: SPACING.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  cardLabel: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  arrowBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
