// Netlify Serverless Function for Google Sheets & CSV live sync
// Path: /.netlify/functions/sync-sheet

import { INITIAL_CSV_RAW } from '../../src/data/initialData.ts';
import {
  DEFAULT_GOOGLE_SHEET_URL,
  buildGoogleSheetCandidateUrls,
  parseCSVDataset,
  getAvailableDates,
  computeDatasetFingerprint,
  mergeSyncedRecordsWithHistory,
  serializeRecordsToCsv,
} from '../../src/utils/patwariAnalytics.ts';

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
    const isDefaultOrLatest =
      !rawUrl ||
      rawUrl === 'default' ||
      rawUrl === 'latest' ||
      rawUrl.includes('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');

    const effectiveUrl = isDefaultOrLatest ? DEFAULT_GOOGLE_SHEET_URL : rawUrl;
    const candidates = buildGoogleSheetCandidateUrls(effectiveUrl, Date.now());
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
          if (csvText && !csvText.trim().startsWith('<!DOCTYPE html') && !csvText.trim().startsWith('<html')) {
            const parsedIncoming = parseCSVDataset(csvText);
            if (parsedIncoming.length > 0) {
              const baseParsed = parseCSVDataset(INITIAL_CSV_RAW);
              const merged = mergeSyncedRecordsWithHistory(baseParsed, parsedIncoming);
              const normalizedCsv = serializeRecordsToCsv(merged);
              const dates = getAvailableDates(merged);
              const latestDate = dates.length > 0 ? dates[dates.length - 1] : '20-10-2026';

              return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                  csv: normalizedCsv,
                  sourceUrl: effectiveUrl,
                  resolvedExportUrl: candidateUrl,
                  syncedAt: new Date().toISOString(),
                  isOfficial: true,
                  recordCount: merged.length,
                  latestDate,
                  fingerprint: computeDatasetFingerprint(merged),
                }),
              };
            }
          }
        }
        lastError = `Google Sheet fetch failed with status ${response.status}`;
      } catch (e: any) {
        lastError = e?.message || lastError;
      }
    }

    // Fallback to bundled 1280-record dataset if live fetch fails during 'latest' / 'default' request
    if (isDefaultOrLatest) {
      const baseParsed = parseCSVDataset(INITIAL_CSV_RAW);
      const dates = getAvailableDates(baseParsed);
      const latestDate = dates.length > 0 ? dates[dates.length - 1] : '20-10-2026';
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          csv: INITIAL_CSV_RAW,
          sourceUrl: DEFAULT_GOOGLE_SHEET_URL,
          syncedAt: new Date().toISOString(),
          isOfficial: true,
          recordCount: baseParsed.length,
          latestDate,
          fingerprint: computeDatasetFingerprint(baseParsed),
        }),
      };
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

