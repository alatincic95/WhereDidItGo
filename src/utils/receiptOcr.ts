import * as FileSystem from 'expo-file-system';
import { getApiKey } from '../assistant/config';
import { EXPENSE_CATEGORIES } from '../types';

export interface OcrResult {
  amount?: number;
  description?: string;
  category?: string;
  date?: string; // ISO string
}

const VISION_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function scanReceipt(imageUri: string): Promise<OcrResult> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  // Read image as base64
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: 'base64',
  });

  // Determine MIME type from URI
  const ext = imageUri.split('.').pop()?.toLowerCase() || 'jpeg';
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
  };
  const mimeType = mimeMap[ext] || 'image/jpeg';

  const categories = EXPENSE_CATEGORIES.join(', ');

  const prompt = `Analyze this receipt image and extract the following information. Respond ONLY with valid JSON, no markdown, no code fences, no extra text.

{
  "amount": <total amount as a number, e.g. 24.99>,
  "description": "<short description of purchase, e.g. 'Grocery shopping' or 'Coffee at Starbucks'>",
  "category": "<one of: ${categories}>",
  "date": "<date from receipt in YYYY-MM-DD format, or null if not visible>"
}

Rules:
- For amount, use the TOTAL or GRAND TOTAL, not subtotals
- If you cannot determine a field, set it to null
- Category must be one of the listed options
- Description should be concise (2-5 words)
- Do not include currency symbols in the amount`;

  const response = await fetch(`${VISION_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 256,
      },
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
    throw new Error(`OCR_ERROR: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No response from vision API');
  }

  // Parse JSON from response (strip any accidental markdown fences)
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const parsed = JSON.parse(cleaned);

  const result: OcrResult = {};

  if (typeof parsed.amount === 'number' && parsed.amount > 0) {
    result.amount = parsed.amount;
  }
  if (typeof parsed.description === 'string' && parsed.description.length > 0) {
    result.description = parsed.description;
  }
  if (typeof parsed.category === 'string' && parsed.category !== 'null') {
    result.category = parsed.category;
  }
  if (typeof parsed.date === 'string' && parsed.date !== 'null') {
    result.date = new Date(parsed.date).toISOString();
  }

  return result;
}
