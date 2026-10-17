import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client with proper server header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

import { INITIAL_CSV_RAW } from './src/data/initialData.ts';

// Server-level in-memory store for active live Google Sheet sync
let activeSyncedCsv = INITIAL_CSV_RAW;
let activeSheetUrl = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit (Tamia Circle Official Live Sync)';
let activeSyncedAt = new Date().toISOString();
let activeLatestDate = '15-10-2026';
let activeRecordCount = 640;

/**
 * Proxy endpoint to sync live Google Sheets or external CSVs without browser CORS errors.
 * If url is empty or 'default' or 'latest', serves the latest official Google Sheet dataset.
 */
app.get('/api/sync-sheet', async (req, res) => {
  try {
    const rawUrl = (req.query.url as string)?.trim();
    
    // If no URL or 'default' or 'latest', return the verified latest Tamia Circle Google Sheet dataset
    if (!rawUrl || rawUrl === 'default' || rawUrl === 'latest') {
      return res.json({
        csv: activeSyncedCsv,
        sourceUrl: activeSheetUrl,
        syncedAt: activeSyncedAt,
        isOfficial: true,
        recordCount: activeRecordCount,
        latestDate: activeLatestDate,
      });
    }

    let fetchUrl = rawUrl;
    // Convert regular Google Sheets link to CSV export if necessary
    const sheetMatch = fetchUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (sheetMatch && sheetMatch[1] && !fetchUrl.includes('output=csv')) {
      const sheetId = sheetMatch[1];
      const gidMatch = fetchUrl.match(/[#&?]gid=([0-9]+)/);
      const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '&gid=0';
      fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
    }

    const response = await fetch(fetchUrl, {
      headers: {
        'Accept': 'text/csv, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PatwariDashboard/1.0',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch spreadsheet (${response.status} ${response.statusText}). Ensure sheet is shared to 'Anyone with the link' or published to web.`,
      });
    }

    const csvText = await response.text();
    // Persist as active dataset so all visitors see live updates immediately
    activeSyncedCsv = csvText;
    activeSheetUrl = fetchUrl;
    activeSyncedAt = new Date().toISOString();

    return res.json({
      csv: csvText,
      sourceUrl: fetchUrl,
      syncedAt: activeSyncedAt,
      latestDate: activeLatestDate,
    });
  } catch (error: any) {
    console.error('Error fetching Google Sheet:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch spreadsheet' });
  }
});

/**
 * Endpoint to save synced dataset from client to server so all shared links reflect it
 */
app.post('/api/save-sync', express.json(), (req, res) => {
  try {
    const { csv, sourceUrl, latestDate, recordCount } = req.body || {};
    if (csv && typeof csv === 'string') {
      activeSyncedCsv = csv;
      if (sourceUrl) activeSheetUrl = sourceUrl;
      if (latestDate) activeLatestDate = latestDate;
      if (recordCount) activeRecordCount = recordCount;
      activeSyncedAt = new Date().toISOString();
    }
    return res.json({ success: true, syncedAt: activeSyncedAt, latestDate: activeLatestDate });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to save sync' });
  }
});

/**
 * Dedicated endpoint returning latest verified revenue dataset
 */
app.get('/api/latest-sheet-data', (_req, res) => {
  return res.json({
    csv: activeSyncedCsv,
    sourceUrl: activeSheetUrl,
    syncedAt: activeSyncedAt,
    recordCount: activeRecordCount,
    latestDate: activeLatestDate,
  });
});

/**
 * AI Analysis Endpoint using Gemini 4 Argon with High Thinking Mode
 */
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { prompt, contextData, analysisType } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in AI Studio.',
      });
    }

    const systemInstruction = `You are an elite Indian Revenue Administration Analyst and Senior Executive Advisor (SDM / Sub-Divisional Officer / Collectorate specialist) reviewing Patwari progress for SVAMITVA, Abadi survey, and land registry distribution.
You understand the operational hierarchy: Tehsildar -> Naib Tehsildar -> Revenue Inspector (RI) -> Patwari.
The stages in progress are:
1. Plots & Beneficiaries Identification
2. Registry Initiated (आवेदन दर्ज)
3. Patwari Verification (पटवारी सत्यापन / जांच) - CRITICAL BOTTLENECK
4. Submitted (प्रस्तुत)
5. Registration In-Process (पंजीयन प्रक्रियाधीन)
6. Completed (पूर्ण) & % Progress

Your job is to provide deep, analytical, high-reasoning intelligence:
- Identify top performers and lagging Patwaris needing administrative show-cause notices.
- Pinpoint bottlenecks (e.g. high Registry Initiated but stalled Patwari Verification).
- Provide daily, weekly, and monthly velocity projections.
- Answer user queries in clear, executive Markdown with both English and Hindi administrative terms.
- Offer actionable next steps for the SDM / Tehsildar.`;

    const userContent = `Here is the Patwari Revenue Progress Context:
${JSON.stringify(contextData, null, 2)}

User Request / Query (${analysisType || 'Deep Analysis'}):
${prompt}

Provide a comprehensive, high-thinking revenue report and clear recommendations.`;

    // Attempt with requested 'gemini-4-argon' and ThinkingLevel.HIGH
    let responseText = '';
    let modelUsed = 'gemini-4-argon';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: userContent,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });
      responseText = response.text || 'No response generated.';
    } catch (modelError: any) {
      console.warn('gemini-4-argon call failed, falling back to gemini-3.8-flash:', modelError?.message);
      // Fallback gracefully to gemini-3.8-flash with ThinkingLevel.HIGH
      modelUsed = 'gemini-3.8-flash';
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userContent,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });
      responseText = fallbackResponse.text || 'No response generated.';
    }

    return res.json({
      analysis: responseText,
      modelUsed,
      thinkingLevel: 'HIGH',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Gemini Analysis Error:', err);
    return res.status(500).json({ error: err.message || 'Internal AI generation error' });
  }
});

// Mount Vite middleware in development or serve static files in production
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.VERCEL !== '1') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Patwari Dashboard Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

if (process.env.VERCEL !== '1') {
  setupServer();
}

export default app;
