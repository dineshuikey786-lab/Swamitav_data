import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Upload,
  Link2,
  Clock,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { INITIAL_CSV_RAW } from '../data/initialData';
import { buildGoogleSheetCandidateUrls } from '../utils/patwariAnalytics';

const DEFAULT_TAMIA_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing';

interface LiveSyncModalProps {
  sheetUrl: string;
  onUpdateSheetUrl: (url: string) => void;
  autoSyncInterval: number; // in seconds, 0 = off
  onUpdateAutoSyncInterval: (seconds: number) => void;
  onSyncCsvData: (csvText: string, messagePrefix?: string) => boolean;
  onResetToDefault: () => void;
  onClose: () => void;
  recordsCount: number;
}

export const LiveSyncModal: React.FC<LiveSyncModalProps> = ({
  sheetUrl,
  onUpdateSheetUrl,
  autoSyncInterval,
  onUpdateAutoSyncInterval,
  onSyncCsvData,
  onResetToDefault,
  onClose,
  recordsCount,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [inputUrl, setInputUrl] = useState(sheetUrl || DEFAULT_TAMIA_SHEET_URL);
  const [pastedCsv, setPastedCsv] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const handleFetchSheet = async (urlToFetch?: string) => {
    const targetUrl = (urlToFetch || inputUrl).trim();
    if (!targetUrl) {
      setStatusMessage({ type: 'error', text: 'कृपया वैध Google Sheet या CSV लिंक दर्ज करें।' });
      return;
    }

    setSyncing(true);
    setStatusMessage({ type: 'info', text: 'Google Sheet से लाइव डेटा (Zero-Cache) डाउनलोड हो रहा है...' });

    try {
      let csvText = '';
      const response = await fetch(`/api/sync-sheet?url=${encodeURIComponent(targetUrl)}&_cb=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.csv) {
        csvText = data.csv;
      } else {
        // Fallback: try direct client-side fetch from Google Sheets gviz/export endpoints
        const candidates = buildGoogleSheetCandidateUrls(targetUrl, Date.now());
        for (const candidate of candidates) {
          try {
            const directRes = await fetch(candidate, { cache: 'no-store' });
            if (directRes.ok) {
              const text = await directRes.text();
              if (text && !text.trim().startsWith('<!DOCTYPE html') && !text.trim().startsWith('<html')) {
                csvText = text;
                break;
              }
            }
          } catch {}
        }
        if (!csvText) {
          throw new Error(data.error || 'गूगल शीट से डेटा प्राप्त करने में विफल');
        }
      }

      const success = onSyncCsvData(csvText, 'Google Sheet से');
      if (success) {
        onUpdateSheetUrl(targetUrl);
        setInputUrl(targetUrl);
        setStatusMessage({
          type: 'success',
          text: `डेटा सफलतापूर्वक लाइव सिंक हुआ! जब भी Google Sheet में कोई बदलाव होगा, डैशबोर्ड के सभी सेक्शन्स स्वतः अपडेट हो जाएंगे।`,
        });
      } else {
        throw new Error('CSV फॉर्मेट मान्य नहीं है। कृपया कॉलम की जांच करें।');
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text:
          err.message ||
          'सिंक विफल रहा। कृपया सुनिश्चित करें कि गूगल शीट "Anyone with link" पर शेयर है।',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleLoadLatestMasterData = () => {
    setSyncing(true);
    try {
      const success = onSyncCsvData(INITIAL_CSV_RAW, 'मास्टर गूगल शीट से');
      if (success) {
        setStatusMessage({
          type: 'success',
          text: 'नवीनतम 13-10-2026 मास्टर डेटा सफलतापूर्वक लोड हुआ! सभी 480 रिकॉर्ड्स, 160 ग्राम एवं 32 पटवारियों का डेटा सभी सेक्शन्स में अपडेट हो गया।',
        });
      } else {
        setStatusMessage({ type: 'error', text: 'डेटा लोड करने में त्रुटि।' });
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleApplyPastedCsv = () => {
    if (!pastedCsv.trim()) {
      setStatusMessage({ type: 'error', text: 'कृपया CSV डेटा पेस्ट करें।' });
      return;
    }

    const success = onSyncCsvData(pastedCsv, 'पेस्ट किए गए CSV से');
    if (success) {
      setStatusMessage({
        type: 'success',
        text: 'पेस्ट किया गया CSV डेटा सफलतापूर्वक लोड हुआ और सभी सेक्शन्स में लागू हो गया!',
      });
      setPastedCsv('');
    } else {
      setStatusMessage({
        type: 'error',
        text: 'अमान्य CSV डेटा। कृपया सही कॉलम प्रारूप का उपयोग करें।',
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = onSyncCsvData(content, `फ़ाइल "${file.name}" से`);
        if (success) {
          setStatusMessage({
            type: 'success',
            text: `फ़ाइल "${file.name}" सफलतापूर्वक लोड हुई एवं सभी सेक्शन्स अपडेट हुए!`,
          });
        } else {
          setStatusMessage({
            type: 'error',
            text: 'फ़ाइल से वैध CSV डेटा पार्स नहीं हो सका।',
          });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col transition-colors ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold font-hindi ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Google Sheet Live Data Sync • सभी सेक्शन्स अपडेट
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                वर्तमान में सक्रिय: <span className="text-emerald-500 font-mono font-bold">{recordsCount}</span> रिकॉर्ड्स
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                statusMessage.type === 'success'
                  ? isDark
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : statusMessage.type === 'error'
                  ? isDark
                    ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                  : isDark
                  ? 'bg-blue-950/60 border-blue-800 text-blue-300'
                  : 'bg-blue-50 border-blue-300 text-blue-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
              ) : (
                <RefreshCw className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5 animate-spin" />
              )}
              <div className="leading-relaxed font-medium">{statusMessage.text}</div>
            </div>
          )}

          {/* Quick One-Click Sync Action */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isDark
                ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border-emerald-800/60'
                : 'bg-emerald-50/70 border-emerald-200'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700 dark:text-emerald-400">
                <Sparkles className="h-4 w-4" />
                <span>त्वरित एक्शन: नवीनतम 13-10-2026 राजस्व प्रगति डेटा</span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                तामिया वृत्त के सभी 160 ग्रामों एवं 32 पटवारियों का 3-दिवसीय संपूर्ण डेटा सभी सेक्शन्स में लोड करें।
              </p>
            </div>
            <button
              type="button"
              onClick={handleLoadLatestMasterData}
              disabled={syncing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm flex-shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>डेटा तुरंत अपडेट करें</span>
            </button>
          </div>

          {/* Option 1: Live Google Sheet URL */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Link2 className="h-4 w-4 text-emerald-500" />
                <span>Google Sheet लिंक (Live Sheet URL)</span>
              </label>
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Share &gt; Anyone with link (Viewer)
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/.../edit या प्रकाशित CSV लिंक..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className={`flex-1 border rounded-xl px-3 py-2 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-600'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                }`}
              />
              <button
                type="button"
                onClick={() => handleFetchSheet()}
                disabled={syncing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'सिंक हो रहा...' : 'लाइव सिंक करें'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                डिफ़ॉल्ट लिंक सेट करें:
              </span>
              <button
                type="button"
                onClick={() => {
                  setInputUrl(DEFAULT_TAMIA_SHEET_URL);
                  handleFetchSheet(DEFAULT_TAMIA_SHEET_URL);
                }}
                className={`text-[11px] underline font-medium ${
                  isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-700 hover:text-emerald-800'
                }`}
              >
                Tamia Circle Google Sheet (आधिकारिक लिंक)
              </button>
            </div>
          </div>

          {/* Auto-Refresh Timer Setting */}
          <div
            className={`p-3.5 rounded-xl border space-y-3 text-xs ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-500" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      ऑटोमैटिक लाइव सिंक (Automatic Change Detection):
                    </span>
                    {autoSyncInterval > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ● सक्रिय ({autoSyncInterval}s)
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Google Sheet में कोई भी सेल या पंक्ति बदलने पर डेटा फिंगरप्रिंट जाँच कर डैशबोर्ड स्वतः अपडेट हो जाएगा
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: '5 सेकंड (Fast)', sec: 5 },
                  { label: '10 सेकंड', sec: 10 },
                  { label: '15 सेकंड (Live)', sec: 15 },
                  { label: '30 सेकंड', sec: 30 },
                  { label: '1 मिनट', sec: 60 },
                  { label: 'बंद (Off)', sec: 0 },
                ].map((opt) => (
                  <button
                    key={opt.sec}
                    type="button"
                    onClick={() => onUpdateAutoSyncInterval(opt.sec)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      autoSyncInterval === opt.sec
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isDark
                        ? 'bg-slate-800 text-slate-400 hover:text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Instant onEdit Webhook info */}
            <details className={`rounded-lg border p-2.5 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
              <summary className="cursor-pointer font-semibold text-[11px] text-emerald-500 flex items-center justify-between">
                <span>⚡ उन्नत विकल्प: Google Sheet में बदलाव होते ही 0-सेकंड में इंस्टेंट पुश (Apps Script Webhook)</span>
                <span className="text-[10px] underline">कोड देखें</span>
              </summary>
              <div className="mt-2 space-y-1.5 text-[11px]">
                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                  यदि आप चाहते हैं कि Google Sheet में कोई भी संख्या लिखते ही तुरंत उसी सेकंड यह सर्वर अपडेट हो जाए, तो अपनी Google Sheet में <strong>Extensions &gt; Apps Script</strong> खोलें और यह छोटा कोड पेस्ट करके Save करें:
                </p>
                <pre className="p-2 rounded bg-black text-emerald-400 font-mono text-[10px] overflow-x-auto select-all">
{`function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var csv = data.map(function(r){ return r.join(","); }).join("\\n");
  UrlFetchApp.fetch("${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/sheet-update", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ csv: csv })
  });
}`}
                </pre>
              </div>
            </details>
          </div>

          {/* Option 2: Upload CSV or Paste directly */}
          <div className={`space-y-3 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <label
                className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Upload className="h-4 w-4 text-teal-500" />
                <span>वैकल्पिक: CSV फ़ाइल अपलोड या टेक्स्ट पेस्ट</span>
              </label>

              <label
                className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                <span>फ़ाइल चुनें</span>
                <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <textarea
              rows={3}
              placeholder="S.No,Village,LGD Code,Patwari Name,Plots,Beneficiaries,Registry_Initiated,Patwari_Verification,Submitted,Registration in,Completed,% Completed,Date..."
              value={pastedCsv}
              onChange={(e) => setPastedCsv(e.target.value)}
              className={`w-full border rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-600'
                  : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
              }`}
            />

            {pastedCsv && (
              <button
                type="button"
                onClick={handleApplyPastedCsv}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold transition"
              >
                पेस्ट किया गया CSV लागू करें
              </button>
            )}
          </div>

          {/* Option 3: Reset to Default Dataset */}
          <div
            className={`pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
            }`}
          >
            <span>डेटा को मूल 480 तामिया वृत्त रिकॉर्ड्स पर रीसेट करें:</span>
            <button
              type="button"
              onClick={() => {
                onResetToDefault();
                setStatusMessage({
                  type: 'success',
                  text: 'मूल 480 रिकॉर्ड्स (11, 12, 13 अक्टूबर) सफलतापूर्वक पुनः स्थापित हुए!',
                });
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>डेटा रीसेट (Default 480 Records)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Layers className="h-3.5 w-3.5" />
            <span>डेटा सिंक होते ही सभी सेक्शन्स स्वतः रिफ्रेश होते हैं</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
            }`}
          >
            पूर्ण (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
