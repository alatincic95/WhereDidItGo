import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useExpenseStore } from '../store/useExpenseStore';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  SHADOWS,
} from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { BUDGET_COLORS, Budget, BudgetTemplate } from '../types';
import { useUndoStore } from '../store/useUndoStore';
import { parseBudgetTransferCode } from '../utils/budgetSharing';
import {
  BudgetSummaryCard,
  BudgetCard,
  BudgetFormModal,
  BudgetTemplatesModal,
  DeleteConfirmModal,
} from '../components/budget';

export const ProjectsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const {
    budgets,
    addBudget,
    addBudgetWithId,
    updateBudget,
    deleteBudget,
    getBudgetTotal,
    getBudgetPendingTotal,
    budgetTemplates,
    addBudgetTemplate,
    deleteBudgetTemplate,
    createBudgetFromTemplate,
    importSharedBudget,
  } = useExpenseStore();
  const showUndo = useUndoStore((s) => s.show);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedColor, setSelectedColor] = useState(BUDGET_COLORS[0]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showDeleteTemplate, setShowDeleteTemplate] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<BudgetTemplate | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCode, setImportCode] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const activeBudgets = budgets.filter((p) => p.status === 'active');
  const completedBudgets = budgets.filter((p) => p.status === 'completed');
  const totalAcrossBudgets = budgets
    .filter((p) => p.status === 'active')
    .reduce((sum, p) => sum + getBudgetTotal(p.id), 0);

  const openModal = (b?: Budget) => {
    if (b) {
      setEditingBudget(b);
      setName(b.name);
      setDescription(b.description);
      setBudget(b.budget?.toString() || '');
      setSelectedColor(b.color);
    } else {
      setEditingBudget(null);
      setName('');
      setDescription('');
      setBudget('');
      setSelectedColor(BUDGET_COLORS[0]);
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      description: description.trim(),
      budget: budget ? parseFloat(budget) : undefined,
      color: selectedColor,
      status: editingBudget?.status || ('active' as const),
    };

    if (editingBudget) {
      updateBudget(editingBudget.id, data);
    } else {
      addBudget(data);
    }
    setModalVisible(false);
  };

  const handleSaveAsTemplate = () => {
    if (!name.trim()) return;
    addBudgetTemplate({
      name: name.trim(),
      description: description.trim(),
      budget: budget ? parseFloat(budget) : undefined,
      color: selectedColor,
      icon: 'bookmark',
    });
    handleSave();
  };

  const handleDelete = (b: Budget) => {
    setBudgetToDelete(b);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (budgetToDelete) {
      const snapshot = budgetToDelete;
      deleteBudget(snapshot.id);
      showUndo({
        message: `Budget "${snapshot.name}" deleted`,
        entityType: 'budget',
        restore: () => addBudgetWithId(snapshot),
      });
      setShowDeleteConfirm(false);
      setBudgetToDelete(null);
    }
  };

  const handleToggleStatus = (b: Budget) => {
    const newStatus = b.status === 'active' ? 'completed' : 'active';
    updateBudget(b.id, { status: newStatus });
  };

  const handleCreateFromTemplate = (templateId: string) => {
    createBudgetFromTemplate(templateId);
    setShowTemplates(false);
  };

  const handleDeleteTemplate = (t: BudgetTemplate) => {
    setTemplateToDelete(t);
    setShowDeleteTemplate(true);
  };

  const handleConfirmDeleteTemplate = () => {
    if (templateToDelete) {
      deleteBudgetTemplate(templateToDelete.id);
      setShowDeleteTemplate(false);
      setTemplateToDelete(null);
    }
  };

  const handleImportBudget = () => {
    if (!importCode.trim()) return;
    const result = parseBudgetTransferCode(importCode.trim());
    if (!result.valid) {
      Alert.alert('Import Failed', result.error);
      return;
    }
    importSharedBudget(result.data.budget, result.data.expenses);
    setShowImportModal(false);
    setImportCode('');
    Alert.alert(
      'Budget Imported',
      `"${result.data.budget.name}" with ${result.data.expenses.length} expense${result.data.expenses.length !== 1 ? 's' : ''} has been added.`
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Budgets</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.templateBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowImportModal(true)}
          >
            <MaterialIcons name="file-download" size={20} color={colors.primary} />
          </TouchableOpacity>
          {budgetTemplates.length > 0 && (
            <TouchableOpacity
              style={[styles.templateBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowTemplates(true)}
            >
              <MaterialIcons name="bookmark" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
            <LinearGradient
              colors={['#6C63FF', '#BB8FCE']}
              style={styles.addBtnGradient}
            >
              <MaterialIcons name="add" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Card */}
        <BudgetSummaryCard
          activeBudgets={activeBudgets}
          totalAcrossBudgets={totalAcrossBudgets}
        />

        {/* Active Budgets */}
        {activeBudgets.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Active</Text>
            {activeBudgets.map((b) => (
              <BudgetCard
                key={b.id}
                budget={b}
                getBudgetTotal={getBudgetTotal}
                getBudgetPendingTotal={getBudgetPendingTotal}
                onPress={(budget) => navigation.navigate('BudgetDetail', { budgetId: budget.id })}
                onEdit={(budget) => openModal(budget)}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </View>
        )}

        {/* Completed Budgets */}
        {completedBudgets.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Completed</Text>
            {completedBudgets.map((b) => (
              <BudgetCard
                key={b.id}
                budget={b}
                getBudgetTotal={getBudgetTotal}
                getBudgetPendingTotal={getBudgetPendingTotal}
                onPress={(budget) => navigation.navigate('BudgetDetail', { budgetId: budget.id })}
                onEdit={(budget) => openModal(budget)}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </View>
        )}

        {budgets.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="account-balance-wallet" size={48} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No budgets yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
              Create a budget to track spending on specific goals like a trip, wedding, or renovation.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => openModal()}
            >
              <LinearGradient
                colors={['#6C63FF', '#BB8FCE']}
                style={styles.emptyBtnGradient}
              >
                <MaterialIcons name="add" size={18} color="#FFF" />
                <Text style={styles.emptyBtnText}>Create Budget</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Add/Edit Modal */}
      <BudgetFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        onSaveAsTemplate={handleSaveAsTemplate}
        editingBudget={editingBudget}
        name={name}
        onNameChange={setName}
        description={description}
        onDescriptionChange={setDescription}
        budget={budget}
        onBudgetChange={setBudget}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        visible={showDeleteConfirm}
        title="Delete Budget"
        message={`Delete "${budgetToDelete?.name}"? Expenses linked to it will be unlinked but not deleted.`}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* Templates Modal */}
      <BudgetTemplatesModal
        visible={showTemplates}
        onClose={() => setShowTemplates(false)}
        templates={budgetTemplates}
        onCreateFromTemplate={handleCreateFromTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />

      {/* Delete Template Confirmation */}
      <DeleteConfirmModal
        visible={showDeleteTemplate}
        title="Delete Template"
        message={`Delete template "${templateToDelete?.name}"?`}
        onCancel={() => setShowDeleteTemplate(false)}
        onConfirm={handleConfirmDeleteTemplate}
      />

      {/* Import Shared Budget Modal */}
      <Modal
        visible={showImportModal}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowImportModal(false); setImportCode(''); }}
      >
        <TouchableOpacity
          style={styles.importOverlay}
          activeOpacity={1}
          onPress={() => { setShowImportModal(false); setImportCode(''); }}
        >
          <View style={[styles.importContainer, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.importTitle, { color: colors.textPrimary }]}>Import Shared Budget</Text>
            <Text style={[styles.importSubtext, { color: colors.textSecondary }]}>
              Paste a transfer code from someone who shared a budget with you.
            </Text>
            <TextInput
              style={[styles.importInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
              value={importCode}
              onChangeText={setImportCode}
              placeholder="Paste transfer code here..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              autoCorrect={false}
            />
            <View style={styles.importActions}>
              <TouchableOpacity
                style={[styles.importCancelBtn, { backgroundColor: colors.background }]}
                onPress={() => { setShowImportModal(false); setImportCode(''); }}
              >
                <Text style={[styles.importCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.importConfirmBtn,
                  !importCode.trim() && { opacity: 0.5 },
                ]}
                onPress={handleImportBudget}
                disabled={!importCode.trim()}
              >
                <LinearGradient
                  colors={['#6C63FF', '#BB8FCE']}
                  style={styles.importConfirmGradient}
                >
                  <MaterialIcons name="file-download" size={16} color="#FFF" />
                  <Text style={styles.importConfirmText}>Import</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    color: COLORS.textPrimary,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  templateBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  addBtnGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  emptyBtn: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  emptyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  emptyBtnText: {
    fontSize: FONT_SIZE.md,
    color: '#FFF',
    fontWeight: '700',
  },

  // Import Modal
  importOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  importContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '90%',
    maxWidth: 400,
  },
  importTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  importSubtext: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  importInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: SPACING.lg,
  },
  importActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
  },
  importCancelBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  importCancelText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  importConfirmBtn: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  importConfirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  importConfirmText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#FFF',
  },
});
