import { INITIAL_CSV_RAW } from '../src/data/initialData.ts';
import { buildGoogleSheetCandidateUrls } from '../src/utils/patwariAnalytics.ts';

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

    if (
      !rawUrl ||
      rawUrl === 'default' ||
      rawUrl === 'latest' ||
      rawUrl.includes('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')
    ) {
      return res.status(200).json({
        csv: INITIAL_CSV_RAW,
        sourceUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
        syncedAt: new Date().toISOString(),
        isOfficial: true,
        recordCount: 960,
        latestDate: '16-10-2026',
      });
    }

    const candidates = buildGoogleSheetCandidateUrls(rawUrl, Date.now());
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
          if (csvText && !csvText.trim().startsWith('<!DOCTYPE html')) {
            return res.status(200).json({
              csv: csvText,
              sourceUrl: candidateUrl,
              syncedAt: new Date().toISOString(),
            });
          }
        }
        lastError = `Google Sheet fetch returned status ${response.status}`;
      } catch (e: any) {
        lastError = e?.message || lastError;
      }
    }

    return res.status(502).json({ error: lastError });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to sync spreadsheet' });
  }
}
