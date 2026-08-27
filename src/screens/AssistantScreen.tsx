import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { ChatMessageBubble } from '../components/assistant/ChatMessageBubble';
import { ChatInputBar } from '../components/assistant/ChatInputBar';
import { SuggestedPrompts } from '../components/assistant/SuggestedPrompts';
import { ChatMessage, GroqMessage, ToolResult } from '../assistant/types';
import { chatWithGroq } from '../assistant/groqClient';
import { buildSystemPrompt } from '../assistant/systemPrompt';
import { ASSISTANT_TOOLS } from '../assistant/tools';
import { executeToolCall } from '../assistant/toolExecutor';
import { hasApiKey } from '../assistant/config';

const MAX_HISTORY = 20;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function AssistantScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const conversationRef = useRef<GroqMessage[]>([]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    hasApiKey().then(setApiKeyConfigured);
  }, []);

  // Welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: apiKeyConfigured
          ? "Hey! I'm your financial assistant. Ask me anything about your finances, or tell me to add expenses, check your balance, and more."
          : 'To get started, add your free Gemini API key in Settings. You can get one at aistudio.google.com — no credit card needed!',
        timestamp: Date.now(),
      },
    ]);
  }, [apiKeyConfigured]);

  const handleSend = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const systemPrompt = buildSystemPrompt();
      conversationRef.current.push({ role: 'user', content: text });

      if (conversationRef.current.length > MAX_HISTORY) {
        conversationRef.current = conversationRef.current.slice(-MAX_HISTORY);
      }

      const apiMessages: GroqMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationRef.current,
      ];

      // Single API call
      const response = await chatWithGroq(apiMessages, ASSISTANT_TOOLS);
      const choice = response.choices?.[0];
      if (!choice) throw new Error('No response from assistant');

      const toolResults: ToolResult[] = [];
      let assistantContent = choice.message.content || '';

      // If the LLM called tools, execute them locally — no second API call
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        for (const toolCall of choice.message.tool_calls) {
          const args = JSON.parse(toolCall.function.arguments);
          const result = executeToolCall(toolCall.function.name, args);
          toolResults.push(result);
        }
        // Use tool result messages as the response if LLM didn't provide text
        if (!assistantContent) {
          assistantContent = toolResults.map((r) => r.message).join('\n\n');
        }
      }

      // Fall back if still empty
      if (!assistantContent) assistantContent = 'Done!';

      // Add to conversation history for multi-turn context
      conversationRef.current.push({ role: 'assistant', content: assistantContent });

      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: assistantContent,
        timestamp: Date.now(),
        toolResults: toolResults.length > 0 ? toolResults : undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error: any) {
      let errorContent: string;
      if (error.message === 'NO_API_KEY') {
        errorContent = 'No API key configured. Add your Gemini API key in Settings to use the assistant.';
      } else if (error.message === 'RATE_LIMITED') {
        errorContent = "I'm a bit busy right now — the free tier limit has been reached. Try again in a minute!";
      } else if (error.message === 'INVALID_API_KEY') {
        errorContent = 'Your API key appears to be invalid. Please check it in Settings.';
      } else if (error.name === 'AbortError') {
        errorContent = 'The request timed out. Please try again.';
      } else {
        console.error('Assistant error:', error.message || error);
        errorContent = `Something went wrong: ${error.message || 'Unknown error'}. Please try again.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'assistant',
          content: errorContent,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClear = () => {
    conversationRef.current = [];
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: "Chat cleared! How can I help you?",
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <MaterialIcons name="smart-toy" size={20} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Assistant</Text>
          </View>
          <TouchableOpacity onPress={handleClear} style={styles.headerButton}>
            <MaterialIcons name="delete-outline" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatMessageBubble message={item} />}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Suggested prompts (show when few messages) */}
        {messages.length <= 2 && (
          <SuggestedPrompts onSelect={handleSend} disabled={!apiKeyConfigured || loading} />
        )}

        {/* Loading indicator */}
        {loading && (
          <View style={styles.typingContainer}>
            <View style={[styles.typingBubble, { backgroundColor: colors.surface }]}>
              <Text style={[styles.typingText, { color: colors.textMuted }]}>Thinking...</Text>
            </View>
          </View>
        )}

        {/* Input */}
        <ChatInputBar onSend={handleSend} loading={loading} disabled={!apiKeyConfigured} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: SPACING.xs,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  messageList: {
    paddingVertical: SPACING.sm,
    flexGrow: 1,
  },
  typingContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  typingBubble: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.lg,
    marginLeft: 36,
  },
  typingText: {
    fontSize: FONT_SIZE.sm,
    fontStyle: 'italic',
  },
});
