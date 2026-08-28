import React from 'react';
import { Activity, CheckCircle2, Clock, Zap, Target, Search, Sliders, Cpu, Award, RefreshCw } from 'lucide-react';

export default function ActivityFeed({ timeline = [] }) {
  const getPhaseIcon = (phase) => {
    switch (phase) {
      case 'OBSERVE':
        return <Activity className="w-3.5 h-3.5 text-sky-400" />;
      case 'DETECT_ABNORMALITY':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'SELECT_TARGET_STAGE':
        return <Target className="w-3.5 h-3.5 text-rose-400" />;
      case 'GENERATE_HYPOTHESES':
      case 'TEST_HYPOTHESES':
        return <Search className="w-3.5 h-3.5 text-indigo-400" />;
      case 'SIMULATE_INTERVENTIONS':
        return <Sliders className="w-3.5 h-3.5 text-cyan-400" />;
      case 'OPTIMIZE_ROI':
        return <Cpu className="w-3.5 h-3.5 text-purple-400" />;
      case 'SELECT_BEST_ACTION':
        return <Award className="w-3.5 h-3.5 text-emerald-400" />;
      case 'RE_EVALUATE_PROCESS':
        return <RefreshCw className="w-3.5 h-3.5 text-teal-400" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm backdrop-blur-sm flex flex-col justify-between max-h-[500px]">
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              Autonomous Investigator Trace
            </h2>
            <p className="text-xs text-slate-400">Live sequential execution state stream.</p>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-950 text-slate-400 border border-slate-800 rounded">
            {timeline.length} STEPS
          </span>
        </div>

        {/* Stream */}
        <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
          {timeline.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-xs text-slate-500">
              Awaiting investigation trigger...
            </div>
          ) : (
            timeline.map((step) => (
              <div key={step.step_number} className="flex items-start gap-3 text-xs">
                <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                  {getPhaseIcon(step.phase)}
                </div>
                <div className="flex-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white text-xs">{step.title}</span>
                    <span className="font-mono text-[9px] text-slate-500">
                      Step 0{step.step_number}
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">{step.detail}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
