import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants/theme';
import { ChatMessage } from '../../assistant/types';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message }) => {
  const { colors } = useTheme();
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
          <MaterialIcons name="smart-toy" size={14} color={colors.primary} />
        </View>
      )}
      {isUser ? (
        <LinearGradient
          colors={['#6C63FF', '#9B59B6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bubble}
        >
          <Text style={styles.userText}>{message.content}</Text>
        </LinearGradient>
      ) : (
        <View style={[styles.bubble, { backgroundColor: colors.surface }]}>
          <Text style={[styles.assistantText, { color: colors.textPrimary }]}>
            {message.content}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: SPACING.md,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAssistant: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  userText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    lineHeight: 21,
  },
  assistantText: {
    fontSize: FONT_SIZE.md,
    lineHeight: 21,
  },
  toolResults: {
    marginTop: 6,
    gap: 4,
  },
  toolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  toolChipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    flexShrink: 1,
  },
});
