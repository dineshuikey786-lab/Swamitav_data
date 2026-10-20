import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { INITIAL_CSV_RAW } from './src/data/initialData.ts';
import {
  DEFAULT_GOOGLE_SHEET_URL,
  DEFAULT_GITHUB_REPO,
  parseCSVDataset,
  getAvailableDates,
  computeDatasetFingerprint,
  buildGoogleSheetCandidateUrls,
  mergeSyncedRecordsWithHistory,
  serializeRecordsToCsv,
  extractCsvFromInitialDataTs,
  chooseFresherDataset,
} from './src/utils/patwariAnalytics.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Lazy-initialize Gemini Client so server startup never fails if GEMINI_API_KEY is unset
function getGenAIClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || 'missing-api-key',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Server-level in-memory store for active live Google Sheet sync
const initialParsed = parseCSVDataset(INITIAL_CSV_RAW);
const initialDates = getAvailableDates(initialParsed);
let activeSyncedCsv = INITIAL_CSV_RAW;
let activeSheetUrl = DEFAULT_GOOGLE_SHEET_URL;
let activeSyncedAt = new Date().toISOString();
let activeLatestDate = initialDates.length > 0 ? initialDates[initialDates.length - 1] : '20-10-2026';
let activeRecordCount = initialParsed.length || 1280;
let activeFingerprint = computeDatasetFingerprint(initialParsed);

/**
 * Writes the given CSV string into src/data/initialData.ts so the codebase and Git repo stay in sync.
 */
function persistCsvToInitialDataFile(csvContent: string): boolean {
  try {
    const targetPath = path.join(__dirname, 'src', 'data', 'initialData.ts');
    const safeCsv = csvContent.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    const fileContent = `// Initial raw dataset provided from Patwari revenue monitoring (Tamia / Chhindwara circle)\nexport const INITIAL_CSV_RAW = \`${safeCsv.trim()}\`;\n`;
    fs.writeFileSync(targetPath, fileContent, 'utf8');
    return true;
  } catch (err) {
    console.warn('Could not persist CSV to initialData.ts:', err);
    return false;
  }
}

/**
 * Ensures the workspace has an initialized Git repository aligned with origin/main on branch main.
 */
function ensureGitRepoInitialized(commitMsg = 'Sync latest Patwari dashboard data and configuration') {
  try {
    const gitDir = path.join(__dirname, '.git');
    if (!fs.existsSync(gitDir)) {
      execSync('git init -b main', { cwd: __dirname, stdio: 'pipe' });
      execSync('git config user.name "Dinesh Uikey"', { cwd: __dirname, stdio: 'pipe' });
      execSync('git config user.email "dineshuikey786@gmail.com"', { cwd: __dirname, stdio: 'pipe' });
      try {
        execSync(`git remote add origin "https://github.com/${DEFAULT_GITHUB_REPO}.git"`, {
          cwd: __dirname,
          stdio: 'pipe',
        });
      } catch {}
      try {
        execSync('git fetch origin main --depth=5', { cwd: __dirname, stdio: 'pipe', timeout: 8000 });
        execSync('git reset --mixed origin/main', { cwd: __dirname, stdio: 'pipe' });
      } catch {}
    } else {
      try {
        const existingRemote = execSync('git remote get-url origin', { cwd: __dirname, encoding: 'utf8' }).trim();
        if (!existingRemote || existingRemote.includes('dineshuikey786/patwari-revenue-dashboard')) {
          execSync(`git remote set-url origin "https://github.com/${DEFAULT_GITHUB_REPO}.git"`, {
            cwd: __dirname,
            stdio: 'pipe',
          });
        }
      } catch {
        try {
          execSync(`git remote add origin "https://github.com/${DEFAULT_GITHUB_REPO}.git"`, {
            cwd: __dirname,
            stdio: 'pipe',
          });
        } catch {}
      }
      // If origin/main exists and HEAD has an unrelated orphan history, align onto origin/main
      try {
        execSync('git rev-parse --verify origin/main', { cwd: __dirname, stdio: 'pipe' });
        try {
          execSync('git merge-base HEAD origin/main', { cwd: __dirname, stdio: 'pipe' });
        } catch {
          execSync('git reset --soft origin/main', { cwd: __dirname, stdio: 'pipe' });
        }
      } catch {}
    }
    execSync('git add -A', { cwd: __dirname, stdio: 'pipe' });
    const statusOut = execSync('git status --porcelain', { cwd: __dirname, encoding: 'utf8' }).trim();
    if (statusOut.length > 0) {
      const safeMsg = commitMsg.replace(/"/g, "'");
      execSync(`git commit -m "${safeMsg}"`, { cwd: __dirname, stdio: 'pipe' });
    }
  } catch (err: any) {
    // Check if repo has zero commits yet
    try {
      execSync('git rev-parse --verify HEAD', { cwd: __dirname, stdio: 'pipe' });
    } catch {
      try {
        execSync('git commit --allow-empty -m "Initial commit"', { cwd: __dirname, stdio: 'pipe' });
      } catch {}
    }
  }
}

/**
 * Proxy endpoint to sync live Google Sheets or external CSVs without browser CORS or caching delays.
 */
app.get('/api/sync-sheet', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');

  try {
    const rawQueryUrl = (req.query.url as string)?.trim();
    const isPlaceholderSheet = (u?: string) =>
      !u || u === 'default' || u.includes('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');

    // Determine effective URL: if 'latest' or empty, use activeSheetUrl if a real Google Sheet was linked
    const effectiveUrl =
      !rawQueryUrl || rawQueryUrl === 'latest'
        ? !isPlaceholderSheet(activeSheetUrl)
          ? activeSheetUrl
          : 'default'
        : rawQueryUrl;

    if (isPlaceholderSheet(effectiveUrl)) {
      return res.json({
        csv: activeSyncedCsv,
        sourceUrl: activeSheetUrl,
        syncedAt: activeSyncedAt,
        isOfficial: true,
        recordCount: activeRecordCount,
        latestDate: activeLatestDate,
        fingerprint: activeFingerprint,
      });
    }

    const candidates = buildGoogleSheetCandidateUrls(effectiveUrl, Date.now());
    let csvText = '';
    let resolvedUrl = effectiveUrl;
    let lastStatus = 500;
    let lastErrorText = '';

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
          const text = await response.text();
          // Ensure Google didn't return an HTML login page instead of CSV
          if (text && !text.trim().startsWith('<!DOCTYPE html') && !text.trim().startsWith('<html')) {
            csvText = text;
            resolvedUrl = candidateUrl;
            break;
          } else {
            lastErrorText =
              'गूगल शीट निजी (Private) है। कृपया Google Sheet में Share -> "Anyone with the link" (Viewer) चालू करें।';
          }
        } else {
          lastStatus = response.status;
          lastErrorText = `Failed to fetch spreadsheet (${response.status} ${response.statusText}). Ensure sheet is shared to 'Anyone with the link'.`;
        }
      } catch (fetchErr: any) {
        lastErrorText = fetchErr?.message || 'Network error fetching Google Sheet';
      }
    }

    if (!csvText) {
      // If this was a background 'latest' check, fall back gracefully to activeSyncedCsv
      if (!rawQueryUrl || rawQueryUrl === 'latest') {
        return res.json({
          csv: activeSyncedCsv,
          sourceUrl: activeSheetUrl,
          syncedAt: activeSyncedAt,
          recordCount: activeRecordCount,
          latestDate: activeLatestDate,
          fingerprint: activeFingerprint,
        });
      }
      return res.status(lastStatus >= 400 ? lastStatus : 502).json({
        error:
          lastErrorText ||
          'Google Sheet से डेटा प्राप्त नहीं हो सका। कृपया सुनिश्चित करें कि शीट "Anyone with the link" पर साझा है।',
      });
    }

    const parsedIncoming = parseCSVDataset(csvText);
    if (parsedIncoming.length === 0) {
      return res.status(422).json({
        error:
          'Google Sheet में मान्य पटवारी/ग्राम कॉलम नहीं मिले। कृपया सुनिश्चित करें कि शीट में Village, Patwari Name, Plots आदि कॉलम मौजूद हैं।',
      });
    }

    // Smartly merge with historical dates if the linked Google Sheet is a single-date live sheet
    const currentParsed = parseCSVDataset(activeSyncedCsv);
    const mergedRecords = mergeSyncedRecordsWithHistory(currentParsed, parsedIncoming);
    const mergedCsv = serializeRecordsToCsv(mergedRecords);

    const newFingerprint = computeDatasetFingerprint(mergedRecords);
    const dates = getAvailableDates(mergedRecords);
    const newestDate = dates.length > 0 ? dates[dates.length - 1] : activeLatestDate;
    const hasChanged = newFingerprint !== activeFingerprint;

    activeSyncedCsv = mergedCsv;
    activeSheetUrl = effectiveUrl;
    activeLatestDate = newestDate;
    activeRecordCount = mergedRecords.length;

    if (hasChanged) {
      activeSyncedAt = new Date().toISOString();
      activeFingerprint = newFingerprint;
      persistCsvToInitialDataFile(mergedCsv);
    }

    return res.json({
      csv: mergedCsv,
      sourceUrl: activeSheetUrl,
      resolvedExportUrl: resolvedUrl,
      syncedAt: activeSyncedAt,
      latestDate: activeLatestDate,
      recordCount: activeRecordCount,
      fingerprint: activeFingerprint,
      hasChanged,
    });
  } catch (error: any) {
    console.error('Error fetching Google Sheet:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch spreadsheet' });
  }
});

/**
 * Endpoint to save synced dataset from client to server and persist to src/data/initialData.ts
 */
app.post('/api/save-sync', (req, res) => {
  try {
    const { csv, sourceUrl, latestDate, recordCount, persistToCodebase = true } = req.body || {};
    if (csv && typeof csv === 'string') {
      const parsed = parseCSVDataset(csv);
      if (parsed.length > 0) {
        activeSyncedCsv = csv;
        if (sourceUrl) activeSheetUrl = sourceUrl;
        const dates = getAvailableDates(parsed);
        activeLatestDate = latestDate || (dates.length > 0 ? dates[dates.length - 1] : activeLatestDate);
        activeRecordCount = recordCount || parsed.length;
        activeSyncedAt = new Date().toISOString();
        activeFingerprint = computeDatasetFingerprint(parsed);

        if (persistToCodebase) {
          persistCsvToInitialDataFile(csv);
        }
      }
    }
    return res.json({
      success: true,
      syncedAt: activeSyncedAt,
      latestDate: activeLatestDate,
      recordCount: activeRecordCount,
      fingerprint: activeFingerprint,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to save sync' });
  }
});

/**
 * Webhook endpoint for instant push from Google Apps Script onEdit(e) trigger
 */
app.post('/api/webhook/sheet-update', async (req, res) => {
  try {
    const { csv, sheetUrl: webhookSheetUrl } = req.body || {};
    if (csv && typeof csv === 'string') {
      const parsed = parseCSVDataset(csv);
      if (parsed.length > 0) {
        const dates = getAvailableDates(parsed);
        activeSyncedCsv = csv;
        activeLatestDate = dates.length > 0 ? dates[dates.length - 1] : activeLatestDate;
        activeRecordCount = parsed.length;
        activeSyncedAt = new Date().toISOString();
        activeFingerprint = computeDatasetFingerprint(parsed);
        persistCsvToInitialDataFile(csv);
        return res.json({
          success: true,
          recordCount: activeRecordCount,
          latestDate: activeLatestDate,
          fingerprint: activeFingerprint,
        });
      }
    }
    return res.json({
      success: true,
      message: 'Webhook received',
      syncedAt: activeSyncedAt,
      fingerprint: activeFingerprint,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Webhook error' });
  }
});

/**
 * Dedicated endpoint returning latest verified revenue dataset + fingerprint for fast polling
 */
app.get('/api/latest-sheet-data', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  return res.json({
    csv: activeSyncedCsv,
    sourceUrl: activeSheetUrl,
    syncedAt: activeSyncedAt,
    recordCount: activeRecordCount,
    latestDate: activeLatestDate,
    fingerprint: activeFingerprint,
  });
});

/**
 * Git & GitHub Repository Status Endpoint
 */
app.get('/api/github/status', (_req, res) => {
  try {
    ensureGitRepoInitialized();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: __dirname, encoding: 'utf8' }).trim();
    const commitHash = execSync('git rev-parse --short HEAD', { cwd: __dirname, encoding: 'utf8' }).trim();
    const commitMessage = execSync('git log -1 --pretty=%B', { cwd: __dirname, encoding: 'utf8' }).trim();
    const commitTime = execSync('git log -1 --format=%cd --date=iso', { cwd: __dirname, encoding: 'utf8' }).trim();
    let remoteUrl = `https://github.com/${DEFAULT_GITHUB_REPO}.git`;
    try {
      const configuredRemote = execSync('git remote get-url origin', { cwd: __dirname, encoding: 'utf8' }).trim();
      if (configuredRemote) {
        remoteUrl = configuredRemote.replace(/https:\/\/[^@]+@github\.com\//, 'https://github.com/');
      }
    } catch {}

    return res.json({
      gitInitialized: true,
      branch,
      commitHash,
      commitMessage,
      commitTime,
      remoteUrl,
      recordCount: activeRecordCount,
      latestDate: activeLatestDate,
      fingerprint: activeFingerprint,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to read Git status' });
  }
});

/**
 * GitHub Pull Endpoint: Pulls latest initialData.ts from GitHub repository and/or live Google Sheet,
 * merges to keep the freshest dataset, persists to initialData.ts, and returns updated CSV.
 */
app.get('/api/github/pull', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  try {
    const repoParam = ((req.query.repo as string) || DEFAULT_GITHUB_REPO).trim();
    const branchParam = ((req.query.branch as string) || 'main').trim();
    const cleanRepo = repoParam
      .replace(/^https?:\/\/github\.com\//, '')
      .replace(/\.git$/, '')
      .replace(/\/$/, '');

    let bestRecords = parseCSVDataset(activeSyncedCsv);
    let sourceLabel = 'स्थानीय मास्टर डेटा';

    // 1. Check GitHub raw initialData.ts
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

    // 2. Also check live Google Sheet so if sheet has newer dates than GitHub, we include them
    try {
      const sheetCandidates = buildGoogleSheetCandidateUrls(activeSheetUrl || DEFAULT_GOOGLE_SHEET_URL, Date.now());
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
    const newestDate = dates.length > 0 ? dates[dates.length - 1] : activeLatestDate;

    activeSyncedCsv = finalCsv;
    activeLatestDate = newestDate;
    activeRecordCount = bestRecords.length;
    activeSyncedAt = new Date().toISOString();
    activeFingerprint = computeDatasetFingerprint(bestRecords);
    persistCsvToInitialDataFile(finalCsv);
    ensureGitRepoInitialized(`Sync latest dataset (${bestRecords.length} records, latest: ${newestDate})`);

    return res.json({
      success: true,
      csv: finalCsv,
      source: sourceLabel,
      repo: cleanRepo,
      branch: branchParam,
      recordCount: activeRecordCount,
      latestDate: activeLatestDate,
      dates,
      syncedAt: activeSyncedAt,
      fingerprint: activeFingerprint,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to pull from GitHub' });
  }
});

/**
 * Git Commit & Direct GitHub Push Endpoint
 * Persists current dashboard CSV data into src/data/initialData.ts, commits to Git,
 * and optionally pushes directly to GitHub if repoUrl + githubToken are provided.
 */
app.post('/api/github/push', (req, res) => {
  try {
    const {
      repoUrl,
      githubToken,
      commitMessage = `Update Patwari Dashboard data (${activeRecordCount} records, latest: ${activeLatestDate})`,
      branch = 'main',
      csv,
    } = req.body || {};

    if (csv && typeof csv === 'string') {
      const parsed = parseCSVDataset(csv);
      if (parsed.length > 0) {
        const dates = getAvailableDates(parsed);
        activeSyncedCsv = csv;
        activeLatestDate = dates.length > 0 ? dates[dates.length - 1] : activeLatestDate;
        activeRecordCount = parsed.length;
        activeSyncedAt = new Date().toISOString();
        activeFingerprint = computeDatasetFingerprint(parsed);
        persistCsvToInitialDataFile(csv);
      }
    } else {
      persistCsvToInitialDataFile(activeSyncedCsv);
    }

    ensureGitRepoInitialized(commitMessage);

    const commitHash = execSync('git rev-parse --short HEAD', { cwd: __dirname, encoding: 'utf8' }).trim();

    // Normalize repoUrl if provided
    let cleanRepoPath = '';
    if (repoUrl && typeof repoUrl === 'string' && repoUrl.trim()) {
      const trimmedRepo = repoUrl.trim().replace(/\.git$/, '').replace(/\/$/, '');
      const ghMatch = trimmedRepo.match(/github\.com[/:]([^/]+\/[^/]+)/);
      if (ghMatch && ghMatch[1]) {
        cleanRepoPath = ghMatch[1];
      } else if (/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(trimmedRepo)) {
        cleanRepoPath = trimmedRepo;
      }
    }

    if (cleanRepoPath) {
      const publicRemote = `https://github.com/${cleanRepoPath}.git`;
      try {
        execSync(`git remote set-url origin "${publicRemote}"`, { cwd: __dirname, stdio: 'pipe' });
      } catch {
        try {
          execSync(`git remote add origin "${publicRemote}"`, { cwd: __dirname, stdio: 'pipe' });
        } catch {}
      }
    }

    if (cleanRepoPath && githubToken && typeof githubToken === 'string' && githubToken.trim()) {
      const token = githubToken.trim();
      const authRemote = `https://x-access-token:${encodeURIComponent(token)}@github.com/${cleanRepoPath}.git`;
      const targetBranch = (branch || 'main').replace(/[^a-zA-Z0-9_.-]/g, '');

      try {
        execSync(`git push --force "${authRemote}" HEAD:refs/heads/${targetBranch}`, {
          cwd: __dirname,
          stdio: 'pipe',
          timeout: 30000,
        });

        return res.json({
          success: true,
          pushedToRemote: true,
          repoWebUrl: `https://github.com/${cleanRepoPath}`,
          branch: targetBranch,
          commitHash,
          commitMessage,
          recordCount: activeRecordCount,
          latestDate: activeLatestDate,
          message: `सफलतापूर्वक GitHub रिपॉजिटरी (${cleanRepoPath}) की '${targetBranch}' ब्रांच पर पुश हो गया!`,
        });
      } catch (pushErr: any) {
        const stderr = pushErr?.stderr?.toString() || pushErr?.message || 'Git push failed';
        const sanitizedErr = stderr.replace(/x-access-token:[^@]+@/g, 'x-access-token:***@');
        return res.status(400).json({
          error: `GitHub Push विफल रहा: ${sanitizedErr}. कृपया सुनिश्चित करें कि रिपॉजिटरी मौजूद है और Personal Access Token में 'repo' या 'Contents: Read & write' अनुमति है।`,
          commitHash,
          localCommitted: true,
        });
      }
    }

    return res.json({
      success: true,
      pushedToRemote: false,
      localCommitted: true,
      commitHash,
      commitMessage,
      recordCount: activeRecordCount,
      latestDate: activeLatestDate,
      message: `वर्तमान डैशबोर्ड डेटा (${activeRecordCount} रिकॉर्ड्स, दिनांक ${activeLatestDate}) सफलतापूर्वक src/data/initialData.ts एवं स्थानीय Git (Commit #${commitHash}) में सुरक्षित हो गया है!`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to commit/push data' });
  }
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
    const ai = getGenAIClient();
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
function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    let viteMiddleware: any = null;
    const viteReadyPromise = (async () => {
      try {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: 'spa',
        });
        viteMiddleware = vite.middlewares;
      } catch (err) {
        console.error('Vite middleware initialization error:', err);
      }
    })();

    app.use(async (req, res, next) => {
      await viteReadyPromise;
      if (viteMiddleware) {
        return viteMiddleware(req, res, next);
      }
      next();
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
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
