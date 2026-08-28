import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants/theme';

interface ChatInputBarProps {
  onSend: (text: string) => void;
  loading: boolean;
  disabled?: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({ onSend, loading, disabled }) => {
  const [text, setText] = useState('');
  const { colors } = useTheme();

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || loading || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const canSend = text.trim().length > 0 && !loading && !disabled;

  return (
    <View style={[styles.container, { borderTopColor: colors.border }]}>
      <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder={disabled ? 'Set up API key in Settings first...' : 'Ask me anything...'}
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline={false}
          editable={!disabled}
          maxLength={500}
        />
        {loading ? (
          <View style={styles.sendBtn}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <TouchableOpacity onPress={handleSend} disabled={!canSend} activeOpacity={0.7}>
            <LinearGradient
              colors={canSend ? ['#6C63FF', '#9B59B6'] : ['transparent', 'transparent']}
              style={styles.sendBtn}
            >
              <MaterialIcons
                name="send"
                size={18}
                color={canSend ? '#FFF' : colors.textMuted}
              />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    paddingLeft: SPACING.md,
    paddingRight: 4,
    height: 46,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    height: '100%',
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
