// Gemini API utility
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_API_KEY = 'AIzaSyB003Y0M_LIzTpfqYJwOeT-2b_HGPd1eek';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
    };
  }[];
}

// Get API key - hardcoded with localStorage override option
export const getApiKey = (): string | null => {
  const userKey = localStorage.getItem('anova-gemini-key');
  return userKey || GEMINI_API_KEY;
};

export const setApiKey = (key: string): void => {
  localStorage.setItem('anova-gemini-key', key);
};

export const removeApiKey = (): void => {
  localStorage.removeItem('anova-gemini-key');
};

// Chat with Gemini
export const chatWithGemini = async (
  messages: GeminiMessage[],
  systemPrompt: string
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API key not available.');
  }

  const response = await fetch(
    `${GEMINI_API_URL}/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: messages,
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 400 && error.error?.message?.includes('API key')) {
      throw new Error('Invalid API key. Please check your Gemini API key in settings.');
    }
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data: GeminiResponse = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
};

// Generate narrative summary
export const generateNarrative = async (dataContext: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API key not available.');
  }

  const prompt = `You are an FP&A analyst writing an executive summary. Based on the following variance data, write a concise 2-3 paragraph narrative suitable for a CFO or board presentation. Focus on:
1. The overall financial position (over/under budget)
2. Top 3-4 most significant variances and their likely causes
3. Key areas requiring attention or action

Be specific with numbers and percentages. Use professional finance language. Do not use bullet points - write in flowing paragraphs.

DATA:
${dataContext}`;

  const response = await fetch(
    `${GEMINI_API_URL}/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1024,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data: GeminiResponse = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Could not generate summary.';
};

// Extract data from image using Gemini Vision
export const extractDataFromImage = async (
  imageBase64: string,
  mimeType: string
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API key not available.');
  }

  const prompt = `Analyze this spreadsheet/table image and extract the data. Return the data in CSV format with these columns:
Category,Budget,Actual

If there are additional columns like Cost Center, GL Account, or Period, include them:
Category,Cost Center,GL Account,Period,Budget,Actual

Rules:
- Use the exact text from the image for category names
- Convert currency values to plain numbers (remove $, commas)
- If Budget/Actual columns have different names (like "Plan", "YTD", "Forecast"), map them appropriately
- Include a header row
- Only return the CSV data, no explanations

If you cannot extract structured data from this image, respond with: ERROR: [reason]`;

  const response = await fetch(
    `${GEMINI_API_URL}/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: imageBase64,
                },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data: GeminiResponse = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'ERROR: Could not extract data.';
};
