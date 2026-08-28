import React, { useState } from 'react';
import { GitBranch, CheckCircle2, AlertTriangle, ArrowDown, ChevronDown, ChevronRight, Zap, Target, Search, Sliders, RefreshCw, Award } from 'lucide-react';

export default function InvestigationTree({ investigation }) {
  const [expandedNodes, setExpandedNodes] = useState({
    hypotheses: true,
    simulations: false,
    reevaluation: true
  });

  if (!investigation) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center backdrop-blur-sm">
        <GitBranch className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-300">No Active Investigation Executed</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Click "RUN AUTONOMOUS INVESTIGATION" in the top bar to trigger the 14-step investigator agent.
        </p>
      </div>
    );
  }

  const toggleNode = (key) => {
    setExpandedNodes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const {
    investigation_id,
    selected_stage,
    selection_reason,
    hypotheses = [],
    simulations = [],
    optimized_portfolio,
    recommended_action,
    re_evaluation
  } = investigation;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-sky-400" />
              Autonomous Investigation Decision Tree
            </h2>
            <span className="font-mono text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-sky-400 font-semibold">
              {investigation_id}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Full transparent audit trail of hypotheses, empirical tests, and re-evaluation.
          </p>
        </div>

        <span className="px-3 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg flex items-center gap-1.5 self-start">
          <CheckCircle2 className="w-3.5 h-3.5" /> AGENT COMPLETED
        </span>
      </div>

      {/* Investigation Pipeline Tree */}
      <div className="space-y-4">
        {/* Node 1: Target Stage Selection */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Step 1 — Target Selection</span>
                <span className="text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {selected_stage}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{selection_reason}</p>
            </div>
          </div>
        </div>

        {/* Tree Connector */}
        <div className="flex justify-center -my-2">
          <div className="w-0.5 h-4 bg-slate-800" />
        </div>

        {/* Node 2: Causal Hypotheses & Tests */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleNode('hypotheses')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                  Step 2 — Causal Hypotheses & Empirical Validation
                </span>
                <div className="text-xs font-bold text-white mt-0.5">
                  Generated {hypotheses.length} Domain Hypotheses
                </div>
              </div>
            </div>
            <button className="text-slate-400 hover:text-white">
              {expandedNodes.hypotheses ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {expandedNodes.hypotheses && (
            <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2.5">
              {hypotheses.map((h) => (
                <div key={h.id} className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-white">{h.title}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                          h.test_status === 'CONFIRMED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {h.test_status} ({Math.round(h.confidence * 100)}% Conf)
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug">{h.description}</p>
                  <div className="mt-2 text-[11px] text-slate-400 font-mono bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800/80">
                    <span className="text-indigo-400 font-semibold">Test: </span>
                    {h.test_method}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tree Connector */}
        <div className="flex justify-center -my-2">
          <div className="w-0.5 h-4 bg-slate-800" />
        </div>

        {/* Node 3: Simulation & Action Selection */}
        {recommended_action && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Step 3 — Selected Optimal Intervention
                  </span>
                  <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    ROI: {recommended_action.impact?.roi_percentage}%
                  </span>
                </div>
                <div className="text-xs font-bold text-white mt-1">
                  {recommended_action.intervention?.name}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {recommended_action.intervention?.description}
                </p>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400">Duration Delta</span>
                    <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                      -{recommended_action.impact?.duration_reduction_pct}%
                    </div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400">Monthly Cost</span>
                    <div className="text-xs font-bold text-white font-mono mt-0.5">
                      ${recommended_action.impact?.monthly_cost?.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400">Monthly Benefit</span>
                    <div className="text-xs font-bold text-sky-400 font-mono mt-0.5">
                      ${recommended_action.impact?.monthly_benefit?.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tree Connector */}
        <div className="flex justify-center -my-2">
          <div className="w-0.5 h-4 bg-slate-800" />
        </div>

        {/* Node 4: Post-Intervention Re-Evaluation */}
        {re_evaluation && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleNode('reevaluation')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                    Step 4 — Post-Intervention Re-Evaluation
                  </span>
                  <div className="text-xs font-bold text-white mt-0.5">
                    {re_evaluation.bottleneck_shifted
                      ? `Target stage healed! Secondary bottleneck emerged at '${re_evaluation.new_primary_bottleneck}'.`
                      : 'Target stage normalized. Process state stabilized.'}
                  </div>
                </div>
              </div>
              <button className="text-slate-400 hover:text-white">
                {expandedNodes.reevaluation ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            {expandedNodes.reevaluation && (
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Target Stage Status: </span>
                    <span className="font-bold text-white">{re_evaluation.original_stage}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 line-through font-mono">
                      {re_evaluation.original_stage_health_before} ({re_evaluation.original_stage_score_before})
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {re_evaluation.original_stage_health_after} ({re_evaluation.original_stage_score_after})
                    </span>
                  </div>
                </div>

                {re_evaluation.bottleneck_shifted && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Autonomous Shift Warning: Upstream throughput release transferred backlog to{' '}
                      <strong>{re_evaluation.new_primary_bottleneck}</strong> ({re_evaluation.new_primary_severity}).
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
