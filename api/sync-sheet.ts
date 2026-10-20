import { INITIAL_CSV_RAW } from '../src/data/initialData.ts';
import {
  DEFAULT_GOOGLE_SHEET_URL,
  buildGoogleSheetCandidateUrls,
  parseCSVDataset,
  getAvailableDates,
  computeDatasetFingerprint,
  mergeSyncedRecordsWithHistory,
  serializeRecordsToCsv,
} from '../src/utils/patwariAnalytics.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Cache-Control, Pragma'
  );
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const rawUrl = (req.query?.url as string)?.trim();
    const isDefaultOrLatest =
      !rawUrl ||
      rawUrl === 'default' ||
      rawUrl === 'latest' ||
      rawUrl.includes('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');

    const effectiveUrl = isDefaultOrLatest ? DEFAULT_GOOGLE_SHEET_URL : rawUrl;
    const candidates = buildGoogleSheetCandidateUrls(effectiveUrl, Date.now());
    let lastError = 'Failed to fetch spreadsheet';

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

              return res.status(200).json({
                csv: normalizedCsv,
                sourceUrl: effectiveUrl,
                resolvedExportUrl: candidateUrl,
                syncedAt: new Date().toISOString(),
                isOfficial: true,
                recordCount: merged.length,
                latestDate,
                fingerprint: computeDatasetFingerprint(merged),
              });
            }
          }
        }
        lastError = `Google Sheet fetch returned status ${response.status}`;
      } catch (e: any) {
        lastError = e?.message || lastError;
      }
    }

    if (isDefaultOrLatest) {
      const baseParsed = parseCSVDataset(INITIAL_CSV_RAW);
      const dates = getAvailableDates(baseParsed);
      const latestDate = dates.length > 0 ? dates[dates.length - 1] : '20-10-2026';
      return res.status(200).json({
        csv: INITIAL_CSV_RAW,
        sourceUrl: DEFAULT_GOOGLE_SHEET_URL,
        syncedAt: new Date().toISOString(),
        isOfficial: true,
        recordCount: baseParsed.length,
        latestDate,
        fingerprint: computeDatasetFingerprint(baseParsed),
      });
    }

    return res.status(502).json({ error: lastError });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to sync spreadsheet' });
  }
}

