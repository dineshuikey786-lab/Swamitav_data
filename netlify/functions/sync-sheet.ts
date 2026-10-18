// Netlify Serverless Function for Google Sheets & CSV live sync
// Path: /.netlify/functions/sync-sheet

import { INITIAL_CSV_RAW } from '../../src/data/initialData.ts';
import { buildGoogleSheetCandidateUrls } from '../../src/utils/patwariAnalytics.ts';

export const handler = async (event: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Cache-Control, Pragma',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const rawUrl = event.queryStringParameters?.url?.trim();

    if (
      !rawUrl ||
      rawUrl === 'default' ||
      rawUrl === 'latest' ||
      rawUrl.includes('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')
    ) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          csv: INITIAL_CSV_RAW,
          sourceUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
          syncedAt: new Date().toISOString(),
          isOfficial: true,
          recordCount: 960,
          latestDate: '16-10-2026',
        }),
      };
    }

    const candidates = buildGoogleSheetCandidateUrls(rawUrl, Date.now());
    let lastError = 'Google Sheet fetch failed';

    for (const candidateUrl of candidates) {
      try {
        const response = await fetch(candidateUrl, {
          headers: {
            'Accept': 'text/csv, text/plain, */*',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PatwariDashboard/2.0',
          },
        });

        if (response.ok) {
          const csvText = await response.text();
          if (csvText && !csvText.trim().startsWith('<!DOCTYPE html')) {
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                csv: csvText,
                sourceUrl: candidateUrl,
                syncedAt: new Date().toISOString(),
              }),
            };
          }
        }
        lastError = `Google Sheet fetch failed with status ${response.status}`;
      } catch (e: any) {
        lastError = e?.message || lastError;
      }
    }

    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: lastError }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err?.message || 'Failed to sync spreadsheet' }),
    };
  }
};
