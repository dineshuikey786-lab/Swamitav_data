import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, contextData, analysisType } = req.body || {};

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in Vercel environment variables.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'patwari-revenue-dashboard',
        },
      },
    });

    const systemInstruction = `You are an elite Indian Revenue Administration Analyst and Senior Executive Advisor (SDM / Sub-Divisional Officer / Collectorate specialist) reviewing Patwari progress for SVAMITVA, Abadi survey, and land registry distribution.
You understand the operational hierarchy: Tehsildar -> Naib Tehsildar -> Revenue Inspector (RI) -> Patwari.
The stages in progress are:
1. Plots & Beneficiaries Identification
2. Registry Initiated (आवेदन दर्ज)
3. Patwari Verification (पटवारी सत्यापन / जांच) - CRITICAL BOTTLENECK
4. Submitted (प्रस्तुत)
5. Registration In-Process (पंजीयन प्रक्रियाधीन)
6. Completed (पूर्ण) & % Progress

Your job is to provide deep, analytical, high-reasoning intelligence in Hindi and English with actionable administrative guidance for SDM / Tehsildar.`;

    const userContent = `Here is the Patwari Revenue Progress Context:
${JSON.stringify(contextData, null, 2)}

User Request / Query (${analysisType || 'Deep Analysis'}):
${prompt}

Provide a comprehensive, high-thinking revenue report and clear recommendations.`;

    let responseText = '';
    let modelUsed = 'gemini-2.5-flash';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userContent,
        config: {
          systemInstruction,
        },
      });
      responseText = response.text || 'No response generated.';
    } catch (modelErr: any) {
      console.warn('Primary model error, retrying:', modelErr?.message);
      const fallback = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: userContent,
        config: {
          systemInstruction,
        },
      });
      responseText = fallback.text || 'No response generated.';
      modelUsed = 'gemini-2.0-flash';
    }

    return res.status(200).json({
      analysis: responseText,
      modelUsed,
      thinkingLevel: 'STANDARD',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Gemini Analysis Error:', err);
    return res.status(500).json({ error: err?.message || 'Internal AI generation error' });
  }
}
