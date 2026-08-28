import React from 'react';
import { X, Clock, AlertTriangle, ShieldCheck, Activity, Users, Zap, TrendingUp } from 'lucide-react';

export default function StageDetailModal({ stage, onClose }) {
  if (!stage) return null;

  const isCritical = stage.health === 'Critical' || stage.severity === 'CRITICAL';
  const isWarning = stage.health === 'Warning' || stage.severity === 'WARNING';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center font-mono font-bold text-sky-400">
              0{stage.order || stage.stage_order || 1}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {stage.name || stage.stage}
                <span
                  className={`px-2 py-0.5 text-xs font-bold uppercase rounded-md border ${
                    isCritical
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : isWarning
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {stage.health || stage.severity}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Stage Diagnostic & Telemetry Drill-Down</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-5">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-400" /> Avg Lead Time
            </span>
            <div className="text-lg font-bold text-white mt-1">
              {stage.mean_duration}m
              <span className="text-[10px] text-slate-400 font-normal ml-1">/ SLA {stage.sla_target}m</span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-indigo-400" /> Queue Delay
            </span>
            <div className="text-lg font-bold text-white mt-1">
              {stage.mean_queue_time}m
              <span className="text-[10px] text-indigo-400 font-normal ml-1">
                ({Math.round(((stage.mean_queue_time || 1) / (stage.mean_duration || 1)) * 100)}%)
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-cyan-400" /> Resource Load
            </span>
            <div className="text-lg font-bold text-white mt-1">
              {Math.round((stage.resource_utilization || stage.utilization || 0.5) * 100)}%
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> SLA Violation Rate
            </span>
            <div className="text-lg font-bold text-rose-400 mt-1">
              {stage.sla_violation_rate || 0}%
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-purple-400" /> Bottleneck Score
            </span>
            <div className="text-lg font-bold text-white mt-1">
              {stage.bottleneck_score || 0}
              <span className="text-[10px] text-slate-400 font-normal ml-1">/ 100</span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Throughput
            </span>
            <div className="text-lg font-bold text-emerald-400 mt-1">
              {stage.throughput || stage.throughput_per_hr || 0}
              <span className="text-[10px] text-slate-400 font-normal ml-1">cases/hr</span>
            </div>
          </div>
        </div>

        {/* Evidence & Diagnostics */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-400" /> Multi-Signal Diagnostic Evidence
          </h4>
          <ul className="space-y-1.5">
            {(stage.evidence || [
              `Operating within target SLA bounds of ${stage.sla_target} minutes.`,
              `Queue-to-processing ratio is stable.`
            ]).map((ev, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                <span>{ev}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            Close Drill-Down
          </button>
        </div>
      </div>
    </div>
  );
}
