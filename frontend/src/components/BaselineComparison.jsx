import React from 'react';
import { Scale, CheckCircle2, XCircle, TrendingUp, DollarSign, Award, ShieldAlert } from 'lucide-react';

export default function BaselineComparison({ comparisonData, mlMetrics }) {
  if (!comparisonData || !comparisonData.baseline || !comparisonData.processx_agent) return null;

  const { baseline, processx_agent, comparison_summary } = comparisonData;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-sky-400" />
            Baseline Heuristic vs ProcessX Agent Scorecard
          </h2>
          <p className="text-xs text-slate-400">
            Comparing naive "Highest Mean Duration" heuristic against ProcessX Multi-Signal Agent.
          </p>
        </div>

        <span className="px-3 py-1 text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded-lg flex items-center gap-1.5 self-start">
          <Award className="w-3.5 h-3.5" /> ROUND 3 BENCHMARK
        </span>
      </div>

      {/* Advantage Banner */}
      <div className="bg-gradient-to-r from-sky-950/40 via-indigo-950/30 to-slate-950 p-4 rounded-xl border border-sky-500/30 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
            Autonomous Advantage
          </span>
          <p className="text-xs text-slate-200 mt-1 leading-relaxed">
            {comparison_summary.key_advantage}
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0 font-mono">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block">ROI Delta</span>
            <span className="text-base font-extrabold text-emerald-400">
              +{comparison_summary.roi_gain_percentage_points}%
            </span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block">Net Profit Delta</span>
            <span className="text-base font-extrabold text-sky-400">
              +${comparison_summary.monthly_profit_gain_dollars?.toLocaleString()}/mo
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Baseline Card */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400">{baseline.strategy_name}</span>
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-slate-800 text-slate-400 rounded">
                Naive Rule
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Selected Stage:</span>
                <span className="font-bold text-white">{baseline.selected_stage}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Root Cause Accuracy:</span>
                <span className="text-rose-400 flex items-center gap-1 text-[11px]">
                  <XCircle className="w-3.5 h-3.5" /> Poor
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Investigation Depth:</span>
                <span className="text-slate-300 font-mono">{baseline.investigation_depth}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Action Chosen:</span>
                <span className="text-slate-300 text-right truncate max-w-[180px]">{baseline.intervention_chosen}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Monthly Net Value:</span>
                <span className="font-mono text-slate-300">${baseline.net_monthly_profit?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Expected ROI:</span>
                <span className="font-mono font-bold text-slate-300">+{baseline.roi_percentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ProcessX Card */}
        <div className="bg-slate-950 p-4 rounded-xl border border-sky-500/40 shadow-lg shadow-sky-500/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-sky-400">{processx_agent.strategy_name}</span>
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded">
                AI Investigator
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Selected Stage:</span>
                <span className="font-bold text-white">{processx_agent.selected_stage}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Root Cause Accuracy:</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {mlMetrics?.delay_classifier
                    ? `${(mlMetrics.delay_classifier.accuracy * 100).toFixed(1)}% Confirmed`
                    : 'High Confidence'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Investigation Depth:</span>
                <span className="text-sky-400 font-mono font-semibold">{processx_agent.investigation_depth}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Action Chosen:</span>
                <span className="text-emerald-400 font-semibold text-right truncate max-w-[180px]">
                  {processx_agent.intervention_chosen}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Monthly Net Value:</span>
                <span className="font-mono font-bold text-sky-400">${processx_agent.net_monthly_profit?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Expected ROI:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">+{processx_agent.roi_percentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
