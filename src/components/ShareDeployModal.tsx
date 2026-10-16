import React, { useState } from 'react';
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
} from 'lucide-react';

interface ShareDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicUrl: string;
  userEmail?: string;
}

export const ShareDeployModal: React.FC<ShareDeployModalProps> = ({
  isOpen,
  onClose,
  publicUrl,
  userEmail = 'dineshuikey786@gmail.com',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-slate-100 font-sans">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white font-bold text-sm">
            <div className="h-8 w-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <span>पब्लिक शेयरिंग एवं Vercel डिप्लॉयमेंट</span>
              <p className="text-[11px] text-slate-400 font-normal">
                डैशबोर्ड को आम जनता एवं अधिकारियों के साथ सार्वजनिक रूप से साझा करें
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

        <div className="p-5 sm:p-6 space-y-6">
          {/* Section 1: Immediate Public Live URL */}
          <div className="bg-gradient-to-br from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-700/60 rounded-xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    सार्वजनिक लाइव लिंक (Currently Active & Live)
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white">
                  यह डैशबोर्ड पहले से ही इंटरनेट पर लाइव एवं पब्लिकली उपलब्ध है:
                </h3>
              </div>

              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                Google Cloud Live
              </span>
            </div>

            {/* URL Box */}
            <div className="mt-3 bg-slate-950/90 border border-slate-700 rounded-xl p-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <Globe className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span className="font-mono text-xs text-emerald-300 truncate select-all">
                  {publicUrl}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow"
                >
                  {copied ? (
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
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                  title="नए टैब में खोलें"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="mt-2 text-[11px] text-slate-400 leading-relaxed flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
              <span>किसी लॉगिन की आवश्यकता नहीं है • कोई भी व्यक्ति या अधिकारी इस लिंक पर क्लिक करके सीधे डैशबोर्ड, चार्ट्स, PDF एवं एक्सेल रिपोर्ट्स देख सकता है।</span>
            </div>
          </div>

          {/* Section 2: Vercel Deployment Instructions */}
          <div className="border border-slate-800 rounded-xl p-4 sm:p-5 bg-slate-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-black text-white flex items-center justify-center font-black text-xs border border-slate-700">
                  ▲
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Vercel पर डिप्लॉयमेंट (Connect with {userEmail})
                </h4>
              </div>
              <span className="text-[10px] text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                vercel.json कॉन्फ़िगर हो चुका है
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              इस प्रोजेक्ट में <code>vercel.json</code> और <code>api/index.ts</code> तैयार कर दिए गए हैं। आप अपने जीमेल खाते (<strong>{userEmail}</strong>) से Vercel में 4 आसान चरणों में डिप्लॉय कर सकते हैं:
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                  1
                </span>
                <div>
                  <strong className="text-white">Vercel पर लॉगिन करें:</strong>{' '}
                  <a
                    href="https://vercel.com/login"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    vercel.com/login <ExternalLink className="h-3 w-3" />
                  </a>{' '}
                  पर जाएं और "Continue with Google" या "Continue with GitHub" चुनकर अपने जीमेल (<strong>{userEmail}</strong>) से लॉगिन करें।
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                  2
                </span>
                <div>
                  <strong className="text-white">New Project बनाएं:</strong> Dashboard में{' '}
                  <span className="text-slate-200 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                    "Add New..." → "Project"
                  </span>{' '}
                  चुनें और अपने GitHub रिपॉजिटरी को आयात (Import) करें।
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                  3
                </span>
                <div>
                  <strong className="text-white">Environment Variables सेट करें:</strong> Settings में{' '}
                  <code className="text-emerald-400 font-mono">GEMINI_API_KEY</code> जोड़ें ताकि AI रेवेन्यू ऑडिट फीचर सुचारू रूप से कार्य करे।
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                  4
                </span>
                <div>
                  <strong className="text-white">Deploy बटन दबाएं:</strong> Vercel स्वचालित रूप से बिल्ड करके आपको <span className="font-mono text-emerald-400">https://your-app.vercel.app</span> का सार्वजनिक लिंक प्रदान कर देगा।
                </div>
              </div>
            </div>
          </div>

          {/* Tips / Assurance */}
          <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-xl p-3.5 text-xs text-indigo-200 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>सुझाव:</strong> यदि आप तुरंत किसी अधिकारी या व्हाट्सएप ग्रुप में साझा करना चाहते हैं, तो ऊपर दिए गए <strong>पब्लिक लाइव लिंक</strong> का तत्काल उपयोग कर सकते हैं। यह पहले से 24/7 ऑनलाइन है।
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
