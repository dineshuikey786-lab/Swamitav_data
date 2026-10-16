import React from 'react';
import { OverallKpis } from '../utils/patwariAnalytics';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface FunnelChartProps {
  kpis: OverallKpis;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({ kpis }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const steps = [
    {
      title: 'कुल भूखंड लक्ष्य',
      sub: 'Total Surveyed Plots',
      count: kpis.totalPlots,
      pctOfTotal: 100,
      color: 'bg-blue-600',
      textColor: isDark ? 'text-blue-400' : 'text-blue-700',
      borderColor: isDark ? 'border-blue-500/40' : 'border-blue-200',
      bgColor: isDark ? 'bg-blue-950/30' : 'bg-blue-50/70',
    },
    {
      title: 'पंजीयन प्रारंभ',
      sub: 'Registry Initiated',
      count: kpis.registryInitiated,
      pctOfTotal: kpis.totalPlots > 0 ? (kpis.registryInitiated / kpis.totalPlots) * 100 : 0,
      color: 'bg-amber-500',
      textColor: isDark ? 'text-amber-400' : 'text-amber-700',
      borderColor: isDark ? 'border-amber-500/40' : 'border-amber-200',
      bgColor: isDark ? 'bg-amber-950/30' : 'bg-amber-50/70',
    },
    {
      title: 'पटवारी सत्यापन',
      sub: 'Field Verified',
      count: kpis.patwariVerification,
      pctOfTotal: kpis.totalPlots > 0 ? (kpis.patwariVerification / kpis.totalPlots) * 100 : 0,
      conversionFromPrev:
        kpis.registryInitiated > 0
          ? (kpis.patwariVerification / kpis.registryInitiated) * 100
          : 0,
      color: 'bg-indigo-600',
      textColor: isDark ? 'text-indigo-400' : 'text-indigo-700',
      borderColor: isDark ? 'border-indigo-500/40' : 'border-indigo-200',
      bgColor: isDark ? 'bg-indigo-950/30' : 'bg-indigo-50/70',
    },
    {
      title: 'अंतिम पूर्ण पंजीयन',
      sub: 'Final Completed',
      count: kpis.completed,
      pctOfTotal: kpis.pctCompleted,
      conversionFromPrev:
        kpis.patwariVerification > 0
          ? (kpis.completed / kpis.patwariVerification) * 100
          : 0,
      color: 'bg-emerald-500',
      textColor: isDark ? 'text-emerald-400' : 'text-emerald-700',
      borderColor: isDark ? 'border-emerald-500/40' : 'border-emerald-200',
      bgColor: isDark ? 'bg-emerald-950/30' : 'bg-emerald-50/70',
    },
  ];

  return (
    <div
      className={`border rounded-2xl p-5 shadow-sm transition ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            राजस्व कार्यप्रवाह फनल (Workflow Pipeline)
          </h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            भूखंड सर्वे से लेकर अंतिम पंजीयन तक की चरणबद्ध स्थिति एवं रूपांतरण दर
          </p>
        </div>

        {kpis.pendingVerification > 0 && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
              isDark
                ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
            <span>रुकावट: {kpis.pendingVerification} आवेदन पटवारी सत्यापन स्तर पर लंबित</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step, idx) => (
          <div
            key={step.title}
            className={`relative rounded-xl border ${step.borderColor} ${step.bgColor} p-3.5 flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  चरण {idx + 1}: {step.title}
                </span>
                {idx < steps.length - 1 && (
                  <span className={`hidden lg:block ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
              <div className={`text-[11px] mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {step.sub}
              </div>

              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black ${step.textColor}`}>
                  {step.count.toLocaleString()}
                </span>
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  ({step.pctOfTotal.toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className={`mt-3 pt-2 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200/60'}`}>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div
                  className={`${step.color} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(100, Math.max(step.pctOfTotal, 2))}%` }}
                />
              </div>

              {step.conversionFromPrev !== undefined && (
                <div className={`mt-1.5 text-[11px] flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span>पिछले चरण से:</span>
                  <span className={`font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {step.conversionFromPrev.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
