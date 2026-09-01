import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { useExpenseStore } from '../store/useExpenseStore';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS, COLORS } from '../constants/theme';
import { formatCurrency } from '../utils/currency';
import {
  NetWorthItem,
  AssetCategory,
  LiabilityCategory,
  ASSET_CATEGORY_LABELS,
  LIABILITY_CATEGORY_LABELS,
  ASSET_CATEGORY_ICONS,
  LIABILITY_CATEGORY_ICONS,
} from '../store/slices/netWorthSlice';
import type { NetWorthItemType } from '../store/slices/netWorthSlice';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_PADDING = SPACING.lg * 4;
const CHART_WIDTH = SCREEN_WIDTH - CHART_PADDING;
const MAX_BAR_HEIGHT = 100;

const ASSET_CATEGORIES: AssetCategory[] = ['cash', 'investment', 'property', 'vehicle', 'other_asset'];
const LIABILITY_CATEGORIES: LiabilityCategory[] = ['mortgage', 'student_loan', 'car_loan', 'credit_card', 'personal_loan', 'other_liability'];

const formatMonth = (m: string) => {
  const [year, month] = m.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month, 10) - 1]} '${year.slice(2)}`;
};

export const NetWorthScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    netWorthItems,
    netWorthSnapshots,
    addNetWorthItem,
    updateNetWorthItem,
    deleteNetWorthItem,
    takeNetWorthSnapshot,
    getNetWorth,
  } = useExpenseStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<NetWorthItem | null>(null);
  const [name, setName] = useState('');
  const [itemType, setItemType] = useState<NetWorthItemType>('asset');
  const [category, setCategory] = useState<AssetCategory | LiabilityCategory>('cash');
  const [value, setValue] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { totalAssets, totalLiabilities, netWorth } = getNetWorth();

  const assets = netWorthItems.filter((i) => i.type === 'asset');
  const liabilities = netWorthItems.filter((i) => i.type === 'liability');

  // Snapshot chart data (last 12)
  const snapshots = netWorthSnapshots.slice(-12);
  const maxSnapshotValue = snapshots.length > 0
    ? Math.max(...snapshots.map((s) => Math.abs(s.netWorth)), 1)
    : 1;

  const openModal = (item?: NetWorthItem) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setItemType(item.type);
      setCategory(item.category);
      setValue(item.value.toString());
    } else {
      setEditingItem(null);
      setName('');
      setItemType('asset');
      setCategory('cash');
      setValue('');
    }
    setShowDeleteConfirm(false);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const parsedValue = parseFloat(value) || 0;
    if (parsedValue <= 0) return;

    if (editingItem) {
      updateNetWorthItem(editingItem.id, {
        name: name.trim(),
        type: itemType,
        category,
        value: parsedValue,
      });
    } else {
      addNetWorthItem({
        name: name.trim(),
        type: itemType,
        category,
        value: parsedValue,
      });
    }
    setModalVisible(false);
  };

  const handleDelete = () => {
    if (editingItem) {
      deleteNetWorthItem(editingItem.id);
      setShowDeleteConfirm(false);
      setModalVisible(false);
    }
  };

  const currentCategories = itemType === 'asset' ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;
  const currentLabels = itemType === 'asset' ? ASSET_CATEGORY_LABELS : LIABILITY_CATEGORY_LABELS;
  const currentIcons = itemType === 'asset' ? ASSET_CATEGORY_ICONS : LIABILITY_CATEGORY_ICONS;

  const renderItem = (item: NetWorthItem) => {
    const icons = item.type === 'asset' ? ASSET_CATEGORY_ICONS : LIABILITY_CATEGORY_ICONS;
    const labels = item.type === 'asset' ? ASSET_CATEGORY_LABELS : LIABILITY_CATEGORY_LABELS;
    const iconName = icons[item.category as keyof typeof icons] || 'more-horiz';
    const catLabel = labels[item.category as keyof typeof labels] || item.category;
    const iconColor = item.type === 'asset' ? colors.success : colors.danger;

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => openModal(item)}
        onLongPress={() => openModal(item)}
        activeOpacity={0.7}
      >
        <GlassCard style={styles.itemCard}>
          <View style={styles.itemRow}>
            <View style={[styles.itemIcon, { backgroundColor: `${iconColor}15`, borderColor: `${iconColor}30` }]}>
              <MaterialIcons name={iconName as any} size={22} color={iconColor} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.itemCategory, { color: colors.textMuted }]}>{catLabel}</Text>
            </View>
            <Text style={[styles.itemValue, { color: item.type === 'asset' ? colors.success : colors.danger }]}>
              {item.type === 'liability' ? '-' : ''}{formatCurrency(item.value)}
            </Text>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Net Worth</Text>
        <TouchableOpacity
          onPress={() => openModal()}
          style={[styles.backBtn, { backgroundColor: colors.primary }]}
          accessibilityLabel="Add asset or liability"
        >
          <MaterialIcons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Summary Card */}
        <GlassCard style={styles.summaryCard} glowColor={netWorth >= 0 ? COLORS.success : COLORS.danger} intensity="medium">
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Assets</Text>
              <Text style={[styles.summaryAmount, { color: colors.success }]}>{formatCurrency(totalAssets)}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Liabilities</Text>
              <Text style={[styles.summaryAmount, { color: colors.danger }]}>{formatCurrency(totalLiabilities)}</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.netWorthLabel, { color: colors.textMuted }]}>NET WORTH</Text>
          <Text style={[styles.netWorthValue, { color: netWorth >= 0 ? colors.success : colors.danger }]}>
            {formatCurrency(netWorth)}
          </Text>
          <TouchableOpacity
            style={[styles.snapshotBtn, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}
            onPress={takeNetWorthSnapshot}
            activeOpacity={0.7}
          >
            <MaterialIcons name="camera-alt" size={16} color={colors.primary} />
            <Text style={[styles.snapshotBtnText, { color: colors.primary }]}>Take Snapshot</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Trend Chart */}
        <GlassCard style={styles.chartCard} intensity="low">
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Net Worth Over Time</Text>
          {snapshots.length < 2 ? (
            <View style={styles.chartHint}>
              <MaterialIcons name="info-outline" size={20} color={colors.textMuted} />
              <Text style={[styles.chartHintText, { color: colors.textMuted }]}>
                Take snapshots monthly to see your net worth trend. Check back next month!
              </Text>
            </View>
          ) : (
            <View style={styles.chartContainer}>
              {/* Y-axis labels */}
              <View style={styles.yAxis}>
                <Text style={[styles.yLabel, { color: colors.textMuted }]}>{formatCurrency(maxSnapshotValue)}</Text>
                <Text style={[styles.yLabel, { color: colors.textMuted }]}>{formatCurrency(0)}</Text>
                <Text style={[styles.yLabel, { color: colors.textMuted }]}>{formatCurrency(-maxSnapshotValue)}</Text>
              </View>
              <View style={styles.barsContainer}>
                {/* Grid lines */}
                <View style={[styles.gridLine, { top: 0, backgroundColor: isDark ? 'rgba(108, 99, 255, 0.08)' : colors.border }]} />
                <View style={[styles.gridLine, { top: '50%', backgroundColor: isDark ? 'rgba(108, 99, 255, 0.15)' : colors.border }]} />
                <View style={[styles.gridLine, { bottom: 0, backgroundColor: isDark ? 'rgba(108, 99, 255, 0.08)' : colors.border }]} />

                {snapshots.map((snap) => {
                  const barHeight = (Math.abs(snap.netWorth) / maxSnapshotValue) * (MAX_BAR_HEIGHT / 2);
                  const isPositive = snap.netWorth >= 0;
                  const barColor = isPositive ? colors.success : colors.danger;
                  const barWidth = Math.min(
                    (CHART_WIDTH - 50 - (snapshots.length - 1) * 6) / snapshots.length,
                    28
                  );

                  return (
                    <View key={snap.month} style={styles.barGroup}>
                      <View style={{ height: MAX_BAR_HEIGHT, justifyContent: 'center' }}>
                        {/* Value label */}
                        <Text
                          style={[
                            styles.barValueLabel,
                            {
                              color: barColor,
                              position: 'absolute',
                              top: isPositive ? (MAX_BAR_HEIGHT / 2) - barHeight - 16 : undefined,
                              bottom: isPositive ? undefined : (MAX_BAR_HEIGHT / 2) - barHeight - 16,
                              width: barWidth + 20,
                              left: -10,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {formatCurrency(snap.netWorth)}
                        </Text>
                        {/* Bar from center */}
                        <View
                          style={{
                            position: 'absolute',
                            width: barWidth,
                            height: Math.max(barHeight, 2),
                            backgroundColor: barColor,
                            borderRadius: 4,
                            top: isPositive ? (MAX_BAR_HEIGHT / 2) - barHeight : MAX_BAR_HEIGHT / 2,
                          }}
                        />
                      </View>
                      <Text style={[styles.barLabel, { color: colors.textMuted }]}>{formatMonth(snap.month)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </GlassCard>

        {/* Assets Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: SPACING.lg }]}>
          Assets ({assets.length})
        </Text>
        {assets.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No assets tracked yet. Tap + to add your first asset.
            </Text>
          </GlassCard>
        ) : (
          assets.map(renderItem)
        )}

        {/* Liabilities Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: SPACING.lg }]}>
          Liabilities ({liabilities.length})
        </Text>
        {liabilities.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No liabilities tracked yet. Tap + to add a liability.
            </Text>
          </GlassCard>
        ) : (
          liabilities.map(renderItem)
        )}

        {/* Note */}
        <View style={styles.noteContainer}>
          <MaterialIcons name="info-outline" size={16} color={colors.textMuted} />
          <Text style={[styles.noteText, { color: colors.textMuted }]}>
            Account balances and tracked debts are included automatically
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={[styles.modalCancel, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {editingItem ? 'Edit Item' : 'New Item'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Name */}
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Checking Account, Student Loan"
              placeholderTextColor={colors.textMuted}
              autoFocus
              maxLength={50}
            />

            {/* Type Toggle */}
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Type</Text>
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  itemType === 'asset' && { borderColor: colors.success, backgroundColor: `${colors.success}15` },
                ]}
                onPress={() => {
                  setItemType('asset');
                  setCategory('cash');
                }}
              >
                <MaterialIcons name="trending-up" size={18} color={itemType === 'asset' ? colors.success : colors.textMuted} />
                <Text style={[styles.typeBtnText, { color: colors.textSecondary }, itemType === 'asset' && { color: colors.success }]}>
                  Asset
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  itemType === 'liability' && { borderColor: colors.danger, backgroundColor: `${colors.danger}15` },
                ]}
                onPress={() => {
                  setItemType('liability');
                  setCategory('mortgage');
                }}
              >
                <MaterialIcons name="trending-down" size={18} color={itemType === 'liability' ? colors.danger : colors.textMuted} />
                <Text style={[styles.typeBtnText, { color: colors.textSecondary }, itemType === 'liability' && { color: colors.danger }]}>
                  Liability
                </Text>
              </TouchableOpacity>
            </View>

            {/* Category Chips */}
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Category</Text>
            <View style={styles.chipGrid}>
              {currentCategories.map((cat) => {
                const isSelected = category === cat;
                const accentColor = itemType === 'asset' ? colors.success : colors.danger;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.chip,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isSelected && { borderColor: accentColor, backgroundColor: `${accentColor}15` },
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <MaterialIcons
                      name={(currentIcons as any)[cat] as any}
                      size={18}
                      color={isSelected ? accentColor : colors.textMuted}
                    />
                    <Text style={[styles.chipText, { color: colors.textSecondary }, isSelected && { color: accentColor }]}>
                      {(currentLabels as any)[cat]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Value */}
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Value</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              value={value}
              onChangeText={setValue}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />

            {/* Delete button (edit mode only) */}
            {editingItem && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setShowDeleteConfirm(true)}
              >
                <MaterialIcons name="delete-outline" size={20} color={COLORS.danger} />
                <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>Delete Item</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Delete Confirm Overlay (inside modal) */}
          {showDeleteConfirm && (
            <View style={[styles.overlay, StyleSheet.absoluteFill]}>
              <View style={[styles.confirmBox, { backgroundColor: colors.surface }]}>
                <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>Delete Item?</Text>
                <Text style={{ color: colors.textSecondary, marginBottom: SPACING.lg }}>
                  "{editingItem?.name}" will be removed from your net worth.
                </Text>
                <View style={styles.confirmBtns}>
                  <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: colors.background }]}
                    onPress={() => setShowDeleteConfirm(false)}
                  >
                    <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: 'rgba(255,61,113,0.12)' }]}
                    onPress={handleDelete}
                  >
                    <Text style={{ color: COLORS.danger, fontWeight: '600' }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },

  // Summary Card
  summaryCard: { marginBottom: SPACING.lg, alignItems: 'center', paddingVertical: SPACING.lg },
  summaryRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', marginBottom: SPACING.md },
  summaryCol: { alignItems: 'center' },
  summaryLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  summaryAmount: { fontSize: FONT_SIZE.xl, fontWeight: '700' },
  divider: { width: '80%', height: 1, marginVertical: SPACING.md },
  netWorthLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  netWorthValue: { fontSize: FONT_SIZE.xxxl, fontWeight: '800', letterSpacing: -1 },
  snapshotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    marginTop: SPACING.md,
    gap: 6,
  },
  snapshotBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },

  // Chart
  chartCard: { marginBottom: SPACING.sm },
  chartContainer: { flexDirection: 'row', marginTop: SPACING.md },
  yAxis: { width: 50, justifyContent: 'space-between', paddingVertical: 2 },
  yLabel: { fontSize: 9, fontWeight: '600' },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: MAX_BAR_HEIGHT,
    position: 'relative',
  },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1 },
  barGroup: { alignItems: 'center' },
  barLabel: { fontSize: 9, fontWeight: '600', marginTop: 4 },
  barValueLabel: { fontSize: 8, fontWeight: '600', textAlign: 'center' },
  chartHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  },
  chartHintText: { fontSize: FONT_SIZE.sm, flex: 1 },

  // Section
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.sm },

  // Item Card
  itemCard: { marginBottom: SPACING.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  itemIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  itemCategory: { fontSize: FONT_SIZE.sm, marginTop: 2 },
  itemValue: { fontSize: FONT_SIZE.lg, fontWeight: '700' },

  // Empty
  emptyCard: { marginBottom: SPACING.sm },
  emptyText: { fontSize: FONT_SIZE.sm, textAlign: 'center', paddingVertical: SPACING.md },

  // Note
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  noteText: { fontSize: FONT_SIZE.xs, flex: 1 },

  // Modal
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  modalCancel: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  modalSave: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  modalContent: { padding: SPACING.lg },
  modalLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  input: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    borderWidth: 1,
  },
  typeToggle: { flexDirection: 'row', gap: SPACING.sm },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    gap: 6,
  },
  typeBtnText: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1.5,
    gap: 6,
  },
  chipText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    marginTop: SPACING.xl,
    gap: SPACING.xs,
  },
  actionBtnText: { fontSize: FONT_SIZE.md, fontWeight: '600' },

  // Overlays
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  confirmBox: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, maxWidth: 400 },
  confirmTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.sm },
  confirmBtns: { flexDirection: 'row', gap: SPACING.sm },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
});
