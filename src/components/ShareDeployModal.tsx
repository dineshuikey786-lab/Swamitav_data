import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Cloud,
  CheckCircle2,
  Info,
  ShieldCheck,
  Zap,
  Github,
  Terminal,
  ArrowRight,
  Download,
  RefreshCw,
  AlertCircle,
  GitCommit,
  KeyRound,
} from 'lucide-react';

interface ShareDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicUrl: string;
  sheetUrl?: string;
  latestDate?: string;
  recordsCount?: number;
  patwarisCount?: number;
  userEmail?: string;
  currentCsv?: string;
}

type DeployTab = 'github' | 'netlify' | 'live' | 'vercel';

export const ShareDeployModal: React.FC<ShareDeployModalProps> = ({
  isOpen,
  onClose,
  publicUrl,
  sheetUrl,
  latestDate = '13-10-2026',
  recordsCount = 480,
  patwarisCount = 36,
  userEmail = 'dineshuikey786@gmail.com',
  currentCsv = '',
}) => {
  const [activeTab, setActiveTab] = useState<DeployTab>('github');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState<'live' | 'base'>('live');
  const [githubRepoName, setGithubRepoName] = useState('dineshuikey786/patwari-revenue-dashboard');
  const [githubToken, setGithubToken] = useState('');
  const [commitMessage, setCommitMessage] = useState(
    `Update Patwari Dashboard data (${recordsCount} records, latest: ${latestDate})`
  );
  const [gitStatus, setGitStatus] = useState<{
    branch: string;
    commitHash: string;
    commitMessage: string;
    remoteUrl: string;
  } | null>(null);
  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    repoWebUrl?: string;
    commitHash?: string;
  } | null>(null);

  useEffect(() => {
    setCommitMessage(`Update Patwari Dashboard data (${recordsCount} records, latest: ${latestDate})`);
  }, [recordsCount, latestDate]);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/github/status')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.commitHash) {
          setGitStatus({
            branch: data.branch || 'main',
            commitHash: data.commitHash,
            commitMessage: data.commitMessage || '',
            remoteUrl: data.remoteUrl || '',
          });
          if (data.remoteUrl) {
            const match = data.remoteUrl.match(/github\.com[/:]([^/]+\/[^/.]+)/);
            if (match && match[1]) {
              setGithubRepoName(match[1]);
            }
          }
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  // Build live deep link with date and Google Sheet link if configured
  const liveSyncUrl = sheetUrl && sheetUrl.trim()
    ? `${publicUrl}?date=${latestDate}&sheet=${encodeURIComponent(sheetUrl.trim())}`
    : `${publicUrl}?date=${latestDate}`;

  const currentActiveUrl = linkMode === 'live' ? liveSyncUrl : publicUrl;

  const handleCopy = (text: string, typeKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(typeKey);
    setTimeout(() => setCopiedType(null), 3000);
  };

  const handleCommitOrPushToGithub = async (withRemoteToken: boolean) => {
    setIsPushing(true);
    setPushResult({
      type: 'info',
      text: withRemoteToken
        ? 'वर्तमान डेटा initialData.ts में सेव करके सीधे GitHub रिपॉजिटरी पर पुश किया जा रहा है...'
        : 'वर्तमान डैशबोर्ड डेटा को src/data/initialData.ts और स्थानीय Git रिपॉजिटरी में कमिट किया जा रहा है...',
    });

    try {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: githubRepoName.trim(),
          githubToken: withRemoteToken ? githubToken.trim() : '',
          commitMessage: commitMessage.trim() || `Update Patwari Dashboard data (${latestDate})`,
          branch: 'main',
          csv: currentCsv || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setPushResult({
          type: 'error',
          text: data.error || 'Git कमिट/पुश में त्रुटि आई।',
          commitHash: data.commitHash,
        });
      } else {
        if (data.commitHash) {
          setGitStatus((prev) => ({
            branch: prev?.branch || 'main',
            commitHash: data.commitHash,
            commitMessage: commitMessage,
            remoteUrl: githubRepoName,
          }));
        }
        setPushResult({
          type: 'success',
          text: data.message || 'डेटा सफलतापूर्वक Git में सुरक्षित हो गया!',
          repoWebUrl: data.repoWebUrl,
          commitHash: data.commitHash,
        });
      }
    } catch (err: any) {
      setPushResult({
        type: 'error',
        text: err?.message || 'सर्वर से संपर्क करने में त्रुटि।',
      });
    } finally {
      setIsPushing(false);
    }
  };

  const handleDownloadInitialDataTs = () => {
    if (!currentCsv) return;
    const safeCsv = currentCsv.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    const content = `// Initial raw dataset provided from Patwari revenue monitoring (Tamia / Chhindwara circle)\nexport const INITIAL_CSV_RAW = \`${safeCsv.trim()}\`;\n`;
    const blob = new Blob([content], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'initialData.ts';
    a.click();
    URL.revokeObjectURL(url);
  };

  const whatsappMessage = `📊 पटवारी प्रगति एवं राजस्व निगरानी डैशबोर्ड (वृत्त: तामिया):\n📅 अद्यतन स्थिति: ${latestDate}\n📂 कुल रिकॉर्ड्स: ${recordsCount} (${patwarisCount} पटवारी)\n\nलाइव डैशबोर्ड देखने के लिए क्लिक करें:\n${currentActiveUrl}`;

  const normalizedRepoSlug = githubRepoName.includes('/')
    ? githubRepoName.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '')
    : `dineshuikey786/${githubRepoName}`;

  const gitPushCommand = `git remote set-url origin https://github.com/${normalizedRepoSlug}.git 2>/dev/null || git remote add origin https://github.com/${normalizedRepoSlug}.git\ngit branch -M main\ngit push -u origin main`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-slate-100 font-sans">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white font-bold text-sm">
            <div className="h-8 w-8 rounded-lg bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <span>प्रोजेक्ट डिप्लॉयमेंट (Netlify &amp; GitHub)</span>
              <p className="text-[11px] text-slate-400 font-normal">
                डैशबोर्ड को Netlify (.netlify.app) और GitHub पर डिप्लॉय एवं साझा करें
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-4 border-b border-slate-800 flex gap-2 overflow-x-auto text-xs bg-slate-900/50">
          <button
            type="button"
            onClick={() => setActiveTab('netlify')}
            className={`pb-2.5 px-3 font-semibold transition border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'netlify'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-teal-400" />
            <span>Netlify (.netlify.app)</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-mono">
              Ready
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`pb-2.5 px-3 font-semibold transition border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'github'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Github className="h-3.5 w-3.5" />
            <span>GitHub पुश सेटअप</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`pb-2.5 px-3 font-semibold transition border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'live'
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>तत्काल लाइव लिंक</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vercel')}
            className={`pb-2.5 px-3 font-semibold transition border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'vercel'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>▲ Vercel</span>
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* TAB 1: NETLIFY DEPLOYMENT */}
          {activeTab === 'netlify' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-teal-950/70 via-slate-900 to-emerald-950/70 border border-teal-600/60 rounded-xl p-4 sm:p-5 relative overflow-hidden shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 font-bold text-xs">
                      N
                    </div>
                    <h3 className="text-sm font-bold text-white">
                      Netlify (.netlify.app) पर 1-क्लिक डिप्लॉय सेटअप
                    </h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono">
                    netlify.toml + _redirects Ready
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  इस प्रोजेक्ट में <code>netlify.toml</code>, <code>public/_redirects</code> (SPA राउटिंग) और <code>netlify/functions/</code> (Google Sheet &amp; AI सर्वरलेस फंक्शन्स) पहले से ही कॉन्फ़िगर हैं।
                </p>

                {/* Netlify Config Summary Box */}
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Build Command</div>
                    <div className="font-mono text-teal-300 font-semibold mt-0.5">npm run build</div>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Publish Directory</div>
                    <div className="font-mono text-teal-300 font-semibold mt-0.5">dist</div>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
                    <div className="text-[10px] text-slate-400">Serverless Functions</div>
                    <div className="font-mono text-teal-300 font-semibold mt-0.5">netlify/functions</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <a
                    href="https://app.netlify.com/start"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-lg active:scale-95"
                  >
                    <span>Netlify में साइट आयात करें (Import to Netlify)</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <a
                    href="https://app.netlify.com"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <span>app.netlify.com खोलें</span>
                  </a>
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-teal-400" />
                  <span>Netlify पर डिप्लॉय करने के 4 आसान चरण:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-[11px]">1</span>
                      <span className="font-bold text-white">GitHub पर पुश करें</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      GitHub पर नया रिपॉजिटरी बनाकर इस प्रोजेक्ट का कोड <code>main</code> ब्रांच पर पुश करें (बगल के 'GitHub' टैब में कमांड्स देखें)।
                    </p>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-[11px]">2</span>
                      <span className="font-bold text-white">Netlify में लॉगिन करें</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      <a href="https://app.netlify.com" target="_blank" rel="noreferrer" className="text-teal-400 hover:underline">app.netlify.com</a> पर अपने GitHub या जीमेल ({userEmail}) से लॉगिन करें।
                    </p>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-[11px]">3</span>
                      <span className="font-bold text-white">Import from GitHub</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      "Add new site" → "Import an existing project" चुनें और अपना GitHub रिपॉजिटरी चुनें।
                    </p>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-[11px]">4</span>
                      <span className="font-bold text-white">Deploy बटन दबाएं</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Netlify स्वचालित रूप से <code>netlify.toml</code> पढ़ लेगा। "Deploy" दबाते ही आपको स्थायी <strong>https://your-name.netlify.app</strong> लिंक मिल जाएगा।
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="text-slate-300">
                    <span className="font-semibold text-white">Environment Variable (वैकल्पिक):</span> Netlify Site settings → Environment variables में <code className="text-teal-400 font-mono">GEMINI_API_KEY</code> जोड़ें।
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GITHUB PUSH */}
          {activeTab === 'github' && (
            <div className="space-y-4">
              {/* Status Result Banner */}
              {pushResult && (
                <div
                  className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                    pushResult.type === 'success'
                      ? 'bg-emerald-950/70 border-emerald-700 text-emerald-200'
                      : pushResult.type === 'error'
                      ? 'bg-rose-950/70 border-rose-700 text-rose-200'
                      : 'bg-blue-950/70 border-blue-700 text-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {pushResult.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : pushResult.type === 'error' ? (
                      <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <RefreshCw className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5 animate-spin" />
                    )}
                    <div className="leading-relaxed">
                      <div className="font-semibold">{pushResult.text}</div>
                      {pushResult.repoWebUrl && (
                        <a
                          href={pushResult.repoWebUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 mt-1 text-emerald-300 underline font-mono"
                        >
                          <span>{pushResult.repoWebUrl}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Card 1: Save Current Dashboard Data into Codebase & Push to GitHub */}
              <div className="bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-700/60 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Github className="h-5 w-5 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">
                      वर्तमान डैशबोर्ड डेटा को GitHub पर पुश करें
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                      <span className="font-mono font-bold">{recordsCount}</span> रिकॉर्ड्स ({latestDate})
                    </span>
                    {gitStatus && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                        {gitStatus.branch} • #{gitStatus.commitHash}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  डैशबोर्ड में वर्तमान में सक्रिय संपूर्ण डेटा (<span className="font-mono font-bold text-white">{recordsCount}</span> रिकॉर्ड्स, नवीनतम तिथि <span className="font-mono font-bold text-emerald-400">{latestDate}</span>) को सीधे <code>src/data/initialData.ts</code> में सुरक्षित करके Git कमिट और GitHub रिपॉजिटरी पर पुश करें:
                </p>

                {/* Form Inputs for Commit & GitHub Remote */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label htmlFor="repo-name" className="text-slate-300 font-medium flex items-center justify-between">
                      <span>GitHub रिपॉजिटरी (Username/Repo):</span>
                      <a
                        href="https://github.com/new"
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline inline-flex items-center gap-0.5 text-[10px]"
                      >
                        <span>+ नया रेपो</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </label>
                    <input
                      id="repo-name"
                      type="text"
                      placeholder="dineshuikey786/patwari-revenue-dashboard"
                      value={githubRepoName}
                      onChange={(e) => setGithubRepoName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="gh-token" className="text-slate-300 font-medium flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <KeyRound className="h-3 w-3 text-amber-400" />
                        <span>GitHub Token (सीधे पुश हेतु):</span>
                      </span>
                      <a
                        href="https://github.com/settings/tokens/new?scopes=repo&description=PatwariDashboardDeploy"
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 hover:underline inline-flex items-center gap-0.5 text-[10px]"
                      >
                        <span>Token प्राप्त करें</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </label>
                    <input
                      id="gh-token"
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (वैकल्पिक)"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label htmlFor="commit-msg" className="text-slate-300 font-medium">
                    Commit Message:
                  </label>
                  <input
                    id="commit-msg"
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-xl text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isPushing}
                    onClick={() => handleCommitOrPushToGithub(false)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-lg active:scale-95"
                  >
                    <GitCommit className="h-4 w-4" />
                    <span>वर्तमान डेटा कोडबेस (initialData.ts) व Git में कमिट करें</span>
                  </button>

                  {githubToken.trim() && (
                    <button
                      type="button"
                      disabled={isPushing}
                      onClick={() => handleCommitOrPushToGithub(true)}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-lg active:scale-95"
                    >
                      <Github className="h-4 w-4" />
                      <span>🚀 सीधे GitHub रिपॉजिटरी पर पुश करें</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleDownloadInitialDataTs}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
                  >
                    <Download className="h-3.5 w-3.5 text-teal-400" />
                    <span>initialData.ts डाउनलोड करें</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Terminal Commands */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="bg-black/80 rounded-xl p-3 border border-slate-800 text-xs relative">
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800 text-[11px] text-slate-400 font-medium font-sans">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5" />
                      <span>टर्मिनल कमांड्स (Copy &amp; Run in Terminal):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(gitPushCommand, 'git')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] flex items-center gap-1 transition cursor-pointer"
                    >
                      {copiedType === 'git' ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span>कॉपी हुआ!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>कमांड कॉपी करें</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
                    {gitPushCommand}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIRECT LIVE LINK */}
          {activeTab === 'live' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-600/70 rounded-xl p-4 sm:p-5 relative overflow-hidden shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      सार्वजनिक लाइव लिंक (Direct Live Link)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                      दिनांक: <span className="font-mono font-bold">{latestDate}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                      <span className="font-mono font-bold">{recordsCount}</span> रिकॉर्ड्स
                    </span>
                  </div>
                </div>

                {/* Link Mode Selector */}
                <div className="flex items-center p-1 bg-slate-950/80 border border-slate-800 rounded-xl mb-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setLinkMode('live')}
                    className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition ${
                      linkMode === 'live'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ⚡ {latestDate} लाइव सिंक लिंक (अनुशंसित)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLinkMode('base')}
                    className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition ${
                      linkMode === 'base'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🌐 सामान्य लिंक (Standard URL)
                  </button>
                </div>

                {/* URL Display Box */}
                <div className="bg-slate-950/90 border border-slate-700 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <Globe className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span className="font-mono text-xs text-emerald-300 truncate select-all">
                      {currentActiveUrl}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(currentActiveUrl, 'url')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow active:scale-95"
                    >
                      {copiedType === 'url' ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>कॉपी हो गया!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>लिंक कॉपी करें</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow active:scale-95"
                      title="WhatsApp पर शेयर करें"
                    >
                      <span>WhatsApp</span>
                    </a>

                    <a
                      href={currentActiveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                      title="नए टैब में खोलकर जांचें"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-300 leading-relaxed flex items-center gap-1.5 bg-slate-900/40 p-2 rounded-lg border border-white/5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    यह डैशबोर्ड अभी भी 24/7 लाइव है। कोई भी व्यक्ति या अधिकारी बिना लॉगिन किए सीधे <strong>{latestDate} का डेटा</strong>, चार्ट्स एवं शासकीय PDF/एक्सेल डाउनलोड कर सकते हैं।
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VERCEL */}
          {activeTab === 'vercel' && (
            <div className="border border-slate-800 rounded-xl p-4 sm:p-5 bg-slate-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-black text-white flex items-center justify-center font-black text-xs border border-slate-700">
                    ▲
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Vercel (.vercel.app) डिप्लॉयमेंट ({userEmail})
                  </h4>
                </div>
                <span className="text-[10px] text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                  vercel.json कॉन्फ़िगर है
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                इस प्रोजेक्ट में <code>vercel.json</code> और <code>api/</code> डायरेक्टरी तैयार है। आप Vercel पर भी GitHub रेपो इम्पोर्ट करके डिप्लॉय कर सकते हैं:
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                  <span>1. vercel.com पर लॉगिन करें</span>
                  <a href="https://vercel.com/login" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1">
                    <span>vercel.com/login</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                  2. GitHub से प्रोजेक्ट आयात करें और Deploy पर क्लिक करें।
                </div>
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="bg-teal-950/40 border border-teal-800/50 rounded-xl p-3 text-xs text-teal-200 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-teal-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>सहायता दस्तावेज़:</strong> विस्तृत निर्देशों के लिए प्रोजेक्ट की <code className="text-teal-300 font-mono">DEPLOY.md</code> फाइल देखें। इसमें Netlify और GitHub के लिए चरणबद्ध गाइड उपलब्ध है।
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
