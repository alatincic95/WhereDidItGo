import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Animated,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
} from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

interface ReceiptSectionProps {
  receiptUri: string | undefined;
  setReceiptUri: (val: string | undefined) => void;
  showReceiptFull: boolean;
  setShowReceiptFull: (val: boolean) => void;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  onScanReceipt?: () => void;
  scanning?: boolean;
}

export const ReceiptSection: React.FC<ReceiptSectionProps> = ({
  receiptUri,
  setReceiptUri,
  showReceiptFull,
  setShowReceiptFull,
  fadeAnim,
  slideAnim,
  onScanReceipt,
  scanning,
}) => {
  const { colors } = useTheme();

  return (
    <>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Receipt (optional)</Text>
        {receiptUri ? (
          <View style={styles.receiptPreviewContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowReceiptFull(true)}
            >
              <Image source={{ uri: receiptUri }} style={[styles.receiptPreview, { backgroundColor: colors.surface }]} resizeMode="cover" />
            </TouchableOpacity>
            <View style={styles.receiptActions}>
              <TouchableOpacity
                style={[styles.receiptActionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={async () => {
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    quality: 0.7,
                    allowsEditing: true,
                  });
                  if (!result.canceled && result.assets[0]) {
                    setReceiptUri(result.assets[0].uri);
                  }
                }}
              >
                <MaterialIcons name="swap-horiz" size={18} color={colors.primary} />
                <Text style={[styles.receiptActionText, { color: colors.primary }]}>Replace</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.receiptActionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setReceiptUri(undefined)}
              >
                <MaterialIcons name="close" size={18} color={colors.danger} />
                <Text style={[styles.receiptActionText, { color: colors.danger }]}>Remove</Text>
              </TouchableOpacity>
            </View>
            {onScanReceipt && (
              <TouchableOpacity
                style={[styles.scanBtn, { backgroundColor: colors.primary }, scanning && styles.scanBtnDisabled]}
                activeOpacity={0.7}
                onPress={onScanReceipt}
                disabled={scanning}
              >
                <MaterialIcons
                  name={scanning ? 'hourglass-top' : 'document-scanner'}
                  size={18}
                  color="#FFF"
                />
                <Text style={styles.scanBtnText}>
                  {scanning ? 'Scanning...' : 'Scan Receipt'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.receiptButtonRow}>
            <TouchableOpacity
              style={[styles.receiptBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.7}
              onPress={async () => {
                const result = await ImagePicker.launchCameraAsync({
                  quality: 0.7,
                  allowsEditing: true,
                });
                if (!result.canceled && result.assets[0]) {
                  setReceiptUri(result.assets[0].uri);
                }
              }}
            >
              <MaterialIcons name="camera-alt" size={22} color={colors.textMuted} />
              <Text style={[styles.receiptBtnText, { color: colors.textMuted }]}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.receiptBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.7}
              onPress={async () => {
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ['images'],
                  quality: 0.7,
                  allowsEditing: true,
                });
                if (!result.canceled && result.assets[0]) {
                  setReceiptUri(result.assets[0].uri);
                }
              }}
            >
              <MaterialIcons name="photo-library" size={22} color={colors.textMuted} />
              <Text style={[styles.receiptBtnText, { color: colors.textMuted }]}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {/* Receipt Full View Modal */}
      <Modal
        visible={showReceiptFull}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReceiptFull(false)}
      >
        <View style={styles.receiptFullOverlay}>
          <TouchableOpacity
            style={styles.receiptFullCloseBtn}
            onPress={() => setShowReceiptFull(false)}
          >
            <MaterialIcons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          {receiptUri && (
            <Image
              source={{ uri: receiptUri }}
              style={styles.receiptFullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },
  receiptButtonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  receiptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    gap: SPACING.sm,
  },
  receiptBtnText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  receiptPreviewContainer: {
    width: '100%',
  },
  receiptPreview: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  receiptActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  receiptActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  receiptActionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  receiptFullOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptFullCloseBtn: {
    position: 'absolute',
    top: 60,
    right: SPACING.lg,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptFullImage: {
    width: '90%',
    height: '70%',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    gap: 6,
  },
  scanBtnDisabled: {
    opacity: 0.6,
  },
  scanBtnText: {
    color: '#FFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});
