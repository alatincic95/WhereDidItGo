import { GroqMessage, GroqResponse, ToolDefinition } from './types';
import { ASSISTANT_CONFIG, getApiKey } from './config';

export async function chatWithGroq(
  messages: GroqMessage[],
  tools: ToolDefinition[]
): Promise<GroqResponse> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  const response = await fetch(ASSISTANT_CONFIG.apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: ASSISTANT_CONFIG.model,
      messages,
      tools,
      tool_choice: 'auto',
      temperature: ASSISTANT_CONFIG.temperature,
      max_tokens: ASSISTANT_CONFIG.maxTokens,
    }),
  });

  if (response.status === 429) {
    throw new Error('RATE_LIMITED');
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error('INVALID_API_KEY');
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`API_ERROR: ${response.status} ${errorBody}`);
  }

  const data: GroqResponse = await response.json();
  return data;
}
