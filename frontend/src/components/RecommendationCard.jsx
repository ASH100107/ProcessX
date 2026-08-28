import React from 'react';
import { Award, DollarSign, TrendingUp, CheckCircle, ShieldCheck, Sparkles, Clock, ArrowRight } from 'lucide-react';

export default function RecommendationCard({ recommendation }) {
  if (!recommendation || !recommendation.intervention) return null;

  const { intervention, target_stage, impact, rationale = [] } = recommendation;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 border border-sky-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 shadow-md shadow-sky-500/30 shrink-0">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Award className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" /> AUTONOMOUS AI RECOMMENDATION
            </span>
            <h3 className="text-base font-extrabold text-white mt-0.5">
              {intervention.name}
            </h3>
          </div>
        </div>

        {/* ROI Badge */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl text-right self-start sm:self-auto">
          <span className="text-[10px] text-emerald-400 font-bold uppercase block">EXPECTED ROI</span>
          <span className="text-lg font-black text-emerald-400 font-mono">
            +{impact?.roi_percentage}%
          </span>
        </div>
      </div>

      {/* Body: Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block font-medium">Monthly Cost</span>
          <span className="text-sm font-bold text-white font-mono mt-0.5 block">
            ${impact?.monthly_cost?.toLocaleString()}
          </span>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block font-medium">Monthly Benefit</span>
          <span className="text-sm font-bold text-sky-400 font-mono mt-0.5 block">
            ${impact?.monthly_benefit?.toLocaleString()}
          </span>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block font-medium">Duration Reduction</span>
          <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
            -{impact?.duration_reduction_pct}%
          </span>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block font-medium">Confidence Score</span>
          <span className="text-sm font-bold text-indigo-300 font-mono mt-0.5 block">
            {Math.round((impact?.confidence || 0.92) * 100)}%
          </span>
        </div>
      </div>

      {/* Rationales */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> Decision Justification
        </h4>
        <ul className="space-y-1.5">
          {rationale.map((r, idx) => (
            <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
