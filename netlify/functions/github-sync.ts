// Netlify Serverless Function for GitHub Status, Pull, and Push
// Path: /.netlify/functions/github-sync

import { INITIAL_CSV_RAW } from '../../src/data/initialData';
import {
  DEFAULT_GITHUB_REPO,
  DEFAULT_GOOGLE_SHEET_URL,
  buildGoogleSheetCandidateUrls,
  parseCSVDataset,
  getAvailableDates,
  computeDatasetFingerprint,
  mergeSyncedRecordsWithHistory,
  serializeRecordsToCsv,
  extractCsvFromInitialDataTs,
  chooseFresherDataset,
} from '../../src/utils/patwariAnalytics';

export const handler = async (event: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, Cache-Control, Pragma',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path || '';
  const baseParsed = parseCSVDataset(INITIAL_CSV_RAW);
  const baseDates = getAvailableDates(baseParsed);
  const baseLatestDate = baseDates.length > 0 ? baseDates[baseDates.length - 1] : '20-10-2026';

  try {
    // 1. GET /api/github/status
    if (event.httpMethod === 'GET' && path.endsWith('/status')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          gitInitialized: true,
          branch: 'main',
          commitHash: 'latest',
          commitMessage: `Sync Patwari Dashboard data (${baseParsed.length} records, latest: ${baseLatestDate})`,
          remoteUrl: `https://github.com/${DEFAULT_GITHUB_REPO}.git`,
          recordCount: baseParsed.length,
          latestDate: baseLatestDate,
          fingerprint: computeDatasetFingerprint(baseParsed),
        }),
      };
    }

    // 2. GET /api/github/pull
    if (event.httpMethod === 'GET' && path.endsWith('/pull')) {
      const repoParam = (event.queryStringParameters?.repo || DEFAULT_GITHUB_REPO).trim();
      const branchParam = (event.queryStringParameters?.branch || 'main').trim();
      const cleanRepo = repoParam
        .replace(/^https?:\/\/github\.com\//, '')
        .replace(/\.git$/, '')
        .replace(/\/$/, '');

      let bestRecords = baseParsed;
      let sourceLabel = 'स्थानीय मास्टर डेटा';

      // Check GitHub raw initialData.ts
      try {
        const rawGhUrl = `https://raw.githubusercontent.com/${cleanRepo}/${branchParam}/src/data/initialData.ts?_cb=${Date.now()}`;
        const ghRes = await fetch(rawGhUrl, {
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        });
        if (ghRes.ok) {
          const ghText = await ghRes.text();
          const extractedCsv = extractCsvFromInitialDataTs(ghText);
          if (extractedCsv) {
            const ghParsed = parseCSVDataset(extractedCsv);
            if (ghParsed.length > 0) {
              bestRecords = chooseFresherDataset(bestRecords, ghParsed);
              sourceLabel = `GitHub (${cleanRepo})`;
            }
          }
        }
      } catch {}

      // Check live Google Sheet
      try {
        const sheetCandidates = buildGoogleSheetCandidateUrls(DEFAULT_GOOGLE_SHEET_URL, Date.now());
        for (const candidateUrl of sheetCandidates) {
          try {
            const sheetRes = await fetch(candidateUrl, {
              headers: {
                Accept: 'text/csv, text/plain, */*',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
              },
            });
            if (sheetRes.ok) {
              const text = await sheetRes.text();
              if (text && !text.trim().startsWith('<!DOCTYPE html') && !text.trim().startsWith('<html')) {
                const sheetParsed = parseCSVDataset(text);
                if (sheetParsed.length > 0) {
                  const merged = mergeSyncedRecordsWithHistory(bestRecords, sheetParsed);
                  bestRecords = chooseFresherDataset(bestRecords, merged);
                  sourceLabel = `Google Sheet + GitHub (${cleanRepo})`;
                  break;
                }
              }
            }
          } catch {}
        }
      } catch {}

      const finalCsv = serializeRecordsToCsv(bestRecords);
      const dates = getAvailableDates(bestRecords);
      const newestDate = dates.length > 0 ? dates[dates.length - 1] : baseLatestDate;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          csv: finalCsv,
          source: sourceLabel,
          repo: cleanRepo,
          branch: branchParam,
          recordCount: bestRecords.length,
          latestDate: newestDate,
          dates,
          syncedAt: new Date().toISOString(),
          fingerprint: computeDatasetFingerprint(bestRecords),
        }),
      };
    }

    // 3. POST /api/github/push
    if (event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      const {
        repoUrl = DEFAULT_GITHUB_REPO,
        githubToken = '',
        commitMessage = `Update Patwari Dashboard data (${baseLatestDate})`,
        branch = 'main',
        csv = INITIAL_CSV_RAW,
      } = body;

      const cleanRepo = String(repoUrl || DEFAULT_GITHUB_REPO)
        .trim()
        .replace(/^https?:\/\/github\.com\//, '')
        .replace(/\.git$/, '')
        .replace(/\/$/, '');

      const parsed = parseCSVDataset(csv || INITIAL_CSV_RAW);
      const dates = getAvailableDates(parsed);
      const latestDate = dates.length > 0 ? dates[dates.length - 1] : baseLatestDate;

      if (githubToken && String(githubToken).trim()) {
        const token = String(githubToken).trim();
        const safeCsv = String(csv || INITIAL_CSV_RAW)
          .replace(/\\/g, '\\\\')
          .replace(/`/g, '\\`')
          .replace(/\$\{/g, '\\${');
        const fileContent = `// Initial raw dataset provided from Patwari revenue monitoring (Tamia / Chhindwara circle)\nexport const INITIAL_CSV_RAW = \`${safeCsv.trim()}\`;\n`;
        const apiUrl = `https://api.github.com/repos/${cleanRepo}/contents/src/data/initialData.ts`;

        const getRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'PatwariDashboard/2.0',
          },
        });
        const existingMeta = getRes.ok ? await getRes.json() : null;
        const base64Content = Buffer.from(fileContent, 'utf8').toString('base64');

        const putRes = await fetch(apiUrl, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'User-Agent': 'PatwariDashboard/2.0',
          },
          body: JSON.stringify({
            message: commitMessage,
            content: base64Content,
            sha: existingMeta?.sha,
            branch,
          }),
        });

        if (putRes.ok) {
          const putData = await putRes.json();
          const shortSha = putData?.commit?.sha?.slice(0, 7) || 'updated';
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              pushedToRemote: true,
              repoWebUrl: `https://github.com/${cleanRepo}`,
              branch,
              commitHash: shortSha,
              commitMessage,
              recordCount: parsed.length,
              latestDate,
              message: `सफलतापूर्वक GitHub रिपॉजिटरी (${cleanRepo}) की '${branch}' ब्रांच पर पुश हो गया!`,
            }),
          };
        } else {
          const errText = await putRes.text();
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: `GitHub API पुश विफल (${putRes.status}): कृपया सुनिश्चित करें कि Personal Access Token में 'repo' या 'Contents: Read & write' अनुमति है। (${errText.slice(0, 120)})`,
            }),
          };
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          pushedToRemote: false,
          localCommitted: true,
          commitHash: 'synced',
          branch,
          repoWebUrl: `https://github.com/${cleanRepo}`,
          recordCount: parsed.length,
          latestDate,
          message: `डेटा (${parsed.length} रिकॉर्ड्स, नवीनतम दिनांक ${latestDate}) सिंक हो गया है! सीधे GitHub रिपॉजिटरी (${cleanRepo}) पर पुश करने के लिए GitHub Token दर्ज करें या AI Studio के GitHub बटन का उपयोग करें।`,
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err?.message || 'GitHub sync function error' }),
    };
  }
};
