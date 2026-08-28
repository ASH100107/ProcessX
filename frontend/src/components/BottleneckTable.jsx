import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronRight, Filter, ShieldAlert, TrendingUp } from 'lucide-react';

export default function BottleneckTable({ bottlenecks, onSelectStage }) {
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  if (!bottlenecks || bottlenecks.length === 0) return null;

  const filtered = bottlenecks.filter((b) => {
    if (filterSeverity === 'ALL') return true;
    return b.severity === filterSeverity;
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-1 text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 rounded-md flex items-center gap-1.5 w-fit">
            <AlertCircle className="w-3.5 h-3.5" /> CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-2.5 py-1 text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md flex items-center gap-1.5 w-fit">
            <AlertTriangle className="w-3.5 h-3.5" /> WARNING
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md flex items-center gap-1.5 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" /> HEALTHY
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-sky-400" />
            Multi-Signal Bottleneck Ranking
          </h2>
          <p className="text-xs text-slate-400">
            Synthesizes P95 delay, queue ratio, SLA breach rate, utilization, and anomaly signals.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start">
          <Filter className="w-3.5 h-3.5 text-slate-500 ml-2" />
          {['ALL', 'CRITICAL', 'WARNING', 'HEALTHY'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
                filterSeverity === sev
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Stage</th>
              <th className="py-3 px-4">Bottleneck Score</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Lead Time (Avg / P95)</th>
              <th className="py-3 px-4">Queue Ratio</th>
              <th className="py-3 px-4">SLA Violations</th>
              <th className="py-3 px-4">Delay Share</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((b) => (
              <tr
                key={b.stage}
                className="hover:bg-slate-800/30 transition duration-150 cursor-pointer"
                onClick={() => onSelectStage && onSelectStage(b)}
              >
                <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                  <span className="font-mono text-slate-500 text-[10px]">0{b.stage_order || 1}</span>
                  <span>{b.stage}</span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full ${
                          b.bottleneck_score >= 68
                            ? 'bg-red-500'
                            : b.bottleneck_score >= 40
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${b.bottleneck_score}%` }}
                      />
                    </div>
                    <span className="font-bold text-white font-mono">{b.bottleneck_score}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4">{getSeverityBadge(b.severity)}</td>
                <td className="py-3.5 px-4 font-mono">
                  <span className="text-white font-bold">{b.mean_duration}m</span>
                  <span className="text-slate-400 ml-1">/ {b.p95_duration}m</span>
                </td>
                <td className="py-3.5 px-4 font-mono text-indigo-300">
                  {b.mean_queue_time}m ({Math.round(b.queue_ratio * 100)}%)
                </td>
                <td className="py-3.5 px-4 font-mono">
                  <span className={b.sla_violation_rate > 10 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                    {b.sla_violation_rate}%
                  </span>
                  <span className="text-[10px] text-slate-500 ml-1">({b.sla_violations_count})</span>
                </td>
                <td className="py-3.5 px-4 font-mono text-sky-400">
                  {b.delay_contribution_pct}%
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300">
                    Inspect <ChevronRight className="w-3 h-3" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
