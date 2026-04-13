import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../components/GlassCard';
import { useExpenseStore } from '../store/useExpenseStore';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { exportBackup, pickAndReadBackupFile } from '../utils/exportData';
import { shareBackupToCloud, generateTransferData, parseTransferData } from '../utils/cloudBackup';

export const DataTransferScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { getBackupState, restoreFromBackup } = useExpenseStore();

  const [transferCode, setTransferCode] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<any>(null);
  const [restoreMessage, setRestoreMessage] = useState('');

  const showStatus = (msg: string, type: 'success' | 'error') => {
    setStatusMessage(msg);
    setStatusType(type);
    setTimeout(() => {
      setStatusMessage('');
      setStatusType('');
    }, 3000);
  };

  const handleCloudBackup = async () => {
    const success = await shareBackupToCloud(getBackupState());
    if (success) {
      showStatus('Backup shared successfully', 'success');
    }
  };

  const handleFileBackup = async () => {
    const success = await exportBackup(getBackupState());
    if (success) {
      showStatus('Backup exported successfully', 'success');
    }
  };

  const handleFileRestore = async () => {
    const result = await pickAndReadBackupFile();
    if (!result.valid) {
      showStatus(result.error, 'error');
      return;
    }
    setPendingRestore(result.data);
    const count = result.data.expenses?.length || 0;
    const date = result.data._meta?.exportedAt
      ? new Date(result.data._meta.exportedAt).toLocaleDateString()
      : 'unknown date';
    setRestoreMessage(
      `Restore backup from ${date}?\n\n` +
      `${count} expenses, ${result.data.budgets?.length || 0} budgets, ` +
      `${result.data.savingsGoals?.length || 0} goals.\n\n` +
      `This will replace ALL current data.`
    );
    setRestoreConfirmOpen(true);
  };

  const handleGenerateCode = async () => {
    const data = await generateTransferData(getBackupState());
    // Encode to base64 for compact transfer
    const encoded = btoa(unescape(encodeURIComponent(data)));
    setTransferCode(encoded);
    setShowCodeModal(true);
  };

  const handleImportFromCode = () => {
    try {
      const decoded = decodeURIComponent(escape(atob(importCode.trim())));
      const result = parseTransferData(decoded);
      if (!result.valid) {
        showStatus(result.error, 'error');
        setShowImportModal(false);
        return;
      }
      setPendingRestore(result.data);
      const count = result.data.expenses?.length || 0;
      setRestoreMessage(
        `Import ${count} expenses and all associated data?\n\nThis will replace ALL current data.`
      );
      setShowImportModal(false);
      setImportCode('');
      setRestoreConfirmOpen(true);
    } catch {
      showStatus('Invalid transfer code', 'error');
    }
  };

  const handleCopyCode = async () => {
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(transferCode);
        showStatus('Code copied to clipboard', 'success');
      } else {
        // On native, share the code via share sheet
        const { Share } = await import('react-native');
        await Share.share({ message: transferCode });
        showStatus('Code shared successfully', 'success');
      }
    } catch {
      showStatus('Copy the code manually', 'error');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Data Transfer</Text>
        <View style={{ width: 44 }} />
      </View>

      {statusMessage !== '' && (
        <View style={[
          styles.statusBar,
          { backgroundColor: statusType === 'success' ? `${colors.success}20` : `${colors.danger}20` },
        ]}>
          <MaterialIcons
            name={statusType === 'success' ? 'check-circle' : 'error'}
            size={18}
            color={statusType === 'success' ? colors.success : colors.danger}
          />
          <Text style={[
            styles.statusText,
            { color: statusType === 'success' ? colors.success : colors.danger },
          ]}>
            {statusMessage}
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cloud Backup Section */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>CLOUD BACKUP</Text>
        <GlassCard style={styles.card}>
          <TouchableOpacity style={styles.optionRow} onPress={handleCloudBackup}>
            <View style={[styles.optionIcon, { backgroundColor: `${colors.success}15` }]}>
              <MaterialIcons name="cloud-upload" size={24} color={colors.success} />
            </View>
            <View style={styles.optionInfo}>
              <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Save to Cloud</Text>
              <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                Share to iCloud Drive, Google Drive, Dropbox, etc.
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        <GlassCard style={styles.card}>
          <TouchableOpacity style={styles.optionRow} onPress={handleFileRestore}>
            <View style={[styles.optionIcon, { backgroundColor: `${colors.primary}15` }]}>
              <MaterialIcons name="cloud-download" size={24} color={colors.primary} />
            </View>
            <View style={styles.optionInfo}>
              <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Restore from File</Text>
              <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                Import a backup file from cloud storage or device
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        {/* File Backup Section */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>LOCAL BACKUP</Text>
        <GlassCard style={styles.card}>
          <TouchableOpacity style={styles.optionRow} onPress={handleFileBackup}>
            <View style={[styles.optionIcon, { backgroundColor: `${colors.warning}15` }]}>
              <MaterialIcons name="save-alt" size={24} color={colors.warning} />
            </View>
            <View style={styles.optionInfo}>
              <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Export Backup File</Text>
              <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                Save a JSON backup to your device
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        {/* Device Transfer Section */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>DEVICE TRANSFER</Text>
        <GlassCard style={styles.card}>
          <TouchableOpacity style={styles.optionRow} onPress={handleGenerateCode}>
            <View style={[styles.optionIcon, { backgroundColor: `${colors.accent}15` }]}>
              <MaterialIcons name="qr-code" size={24} color={colors.accent} />
            </View>
            <View style={styles.optionInfo}>
              <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Generate Transfer Code</Text>
              <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                Create a code to transfer data to another device
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        <GlassCard style={styles.card}>
          <TouchableOpacity style={styles.optionRow} onPress={() => setShowImportModal(true)}>
            <View style={[styles.optionIcon, { backgroundColor: `${colors.primary}15` }]}>
              <MaterialIcons name="input" size={24} color={colors.primary} />
            </View>
            <View style={styles.optionInfo}>
              <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Import Transfer Code</Text>
              <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                Paste a transfer code from another device
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Transfer Code Modal */}
      <Modal
        visible={showCodeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCodeModal(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          activeOpacity={1}
          onPress={() => setShowCodeModal(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: isDark ? colors.backgroundCard : colors.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <MaterialIcons name="qr-code-2" size={40} color={colors.primary} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Transfer Code</Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              Copy this code and paste it on your other device to transfer all data.
            </Text>
            <View style={[styles.codeBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.codeText, { color: colors.textSecondary }]} numberOfLines={4}>
                {transferCode.substring(0, 120)}...
              </Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowCodeModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCopyCode}>
                <LinearGradient colors={[colors.primary, '#9B59B6']} style={styles.modalConfirmBtn}>
                  <MaterialIcons name="content-copy" size={18} color="#FFF" />
                  <Text style={styles.modalConfirmText}>Copy Code</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Import Code Modal */}
      <Modal
        visible={showImportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImportModal(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          activeOpacity={1}
          onPress={() => setShowImportModal(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: isDark ? colors.backgroundCard : colors.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <MaterialIcons name="input" size={40} color={colors.primary} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Import Data</Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              Paste the transfer code from your other device.
            </Text>
            <TextInput
              style={[styles.importInput, {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.textPrimary,
              }]}
              value={importCode}
              onChangeText={setImportCode}
              placeholder="Paste transfer code here..."
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => { setShowImportModal(false); setImportCode(''); }}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleImportFromCode} disabled={!importCode.trim()}>
                <LinearGradient
                  colors={importCode.trim() ? [colors.primary, '#9B59B6'] : [colors.textMuted, colors.textMuted]}
                  style={styles.modalConfirmBtn}
                >
                  <Text style={styles.modalConfirmText}>Import</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Restore Confirmation */}
      <Modal
        visible={restoreConfirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setRestoreConfirmOpen(false);
          setPendingRestore(null);
        }}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          activeOpacity={1}
          onPress={() => {
            setRestoreConfirmOpen(false);
            setPendingRestore(null);
          }}
        >
          <View
            style={[styles.modalContent, { backgroundColor: isDark ? colors.backgroundCard : colors.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <MaterialIcons name="restore" size={40} color={colors.warning} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Restore Data?</Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>{restoreMessage}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setRestoreConfirmOpen(false);
                  setPendingRestore(null);
                }}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                if (pendingRestore) {
                  restoreFromBackup(pendingRestore);
                  showStatus('Data restored successfully', 'success');
                }
                setRestoreConfirmOpen(false);
                setPendingRestore(null);
              }}>
                <LinearGradient colors={[colors.warning, '#FF8E53']} style={styles.modalConfirmBtn}>
                  <Text style={styles.modalConfirmText}>Restore</Text>
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
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
    marginLeft: SPACING.xs,
  },
  card: {
    marginBottom: SPACING.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  optionDesc: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  statusText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  modalDesc: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  codeBox: {
    width: '100%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  codeText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  importInput: {
    width: '100%',
    height: 120,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  modalConfirmText: {
    color: '#FFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
