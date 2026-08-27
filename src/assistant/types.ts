export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolResults?: ToolResult[];
}

export interface ToolResult {
  tool: string;
  success: boolean;
  message: string;
}

// Groq API types (OpenAI-compatible)
export interface GroqMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: GroqToolCall[];
  tool_call_id?: string;
}

export interface GroqToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface GroqResponse {
  choices: Array<{
    message: {
      content: string | null;
      tool_calls?: GroqToolCall[];
    };
    finish_reason: string;
  }>;
  error?: {
    message: string;
    type: string;
    code?: string;
  };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description: string;
        enum?: string[];
        default?: any;
      }>;
      required?: string[];
    };
  };
}
