// Netlify Serverless Function for Gemini AI revenue audit
// Path: /.netlify/functions/gemini-analyze

import { GoogleGenAI } from '@google/genai';

export const handler = async (event: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'GEMINI_API_KEY environment variable is not configured on Netlify. Please add it in Netlify Site Settings -> Environment Variables.',
        }),
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    const { prompt, contextData, analysisType } = JSON.parse(event.body || '{}');

    const systemInstruction = `You are a Senior Revenue Inspector and Land Records Analyst for the Revenue Department, Circle Tamia, Madhya Pradesh.
Analyze the provided Patwari-wise data and revenue metrics objectively and constructively.
Provide analysis in clear Hindi (Devanagari) accompanied by key English terms where helpful.`;

    const fullPrompt = `Task: ${analysisType || 'Revenue Progress & Bottleneck Analysis'}
Data Context:
${JSON.stringify(contextData || {}, null, 2)}

User Question / Focus Area:
${prompt || 'Provide key recommendations for backlog clearance and Patwari performance improvement.'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        analysis: response.text || 'विश्लेषण उत्पन्न नहीं हो सका। कृपया पुनः प्रयास करें।',
        model: 'gemini-2.5-flash',
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Internal error processing AI analysis',
      }),
    };
  }
};
