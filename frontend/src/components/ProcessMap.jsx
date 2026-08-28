import React, { useState } from 'react';
import { ArrowRight, AlertCircle, CheckCircle2, AlertTriangle, Layers, Info } from 'lucide-react';
import StageDetailModal from './StageDetailModal';

export default function ProcessMap({ mapData }) {
  const [selectedStage, setSelectedStage] = useState(null);

  if (!mapData || !mapData.nodes) return null;

  const getBorderAndGlow = (health) => {
    switch (health) {
      case 'Critical':
        return 'border-red-500/80 bg-red-950/20 shadow-lg shadow-red-500/20 glow-critical';
      case 'Warning':
        return 'border-amber-500/80 bg-amber-950/20 shadow-md shadow-amber-500/10 glow-warning';
      default:
        return 'border-emerald-500/30 bg-slate-900/90 hover:border-emerald-500/60';
    }
  };

  const getHealthBadge = (health) => {
    switch (health) {
      case 'Critical':
        return {
          label: 'CRITICAL',
          classes: 'bg-red-500/20 text-red-400 border border-red-500/40',
          icon: AlertCircle
        };
      case 'Warning':
        return {
          label: 'WARNING',
          classes: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
          icon: AlertTriangle
        };
      default:
        return {
          label: 'HEALTHY',
          classes: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
          icon: CheckCircle2
        };
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            Autonomous Process Flow Map
          </h2>
          <p className="text-xs text-slate-400">
            Real-time stage health, bottleneck scores, and queue dynamics. Click any stage to inspect.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Healthy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Warning
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Critical
          </span>
        </div>
      </div>

      {/* Process Flow Cards Sequence */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 relative">
        {mapData.nodes.map((node, index) => {
          const badge = getHealthBadge(node.health);
          const BadgeIcon = badge.icon;
          const isBottleneck = node.health === 'Critical' || node.health === 'Warning';

          return (
            <div key={node.id} className="flex flex-col items-stretch relative group">
              {/* Stage Card */}
              <div
                onClick={() => setSelectedStage(node)}
                className={`flex-1 p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${getBorderAndGlow(
                  node.health
                )}`}
              >
                <div>
                  {/* Top Order & Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      0{node.order}
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded flex items-center gap-1 ${badge.classes}`}>
                      <BadgeIcon className="w-2.5 h-2.5" />
                      {badge.label}
                    </span>
                  </div>

                  {/* Stage Title */}
                  <h3 className="text-xs font-bold text-white leading-tight line-clamp-2 mt-1">
                    {node.name}
                  </h3>
                </div>

                {/* Metrics */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Lead Time:</span>
                    <span className="font-semibold text-white font-mono">{node.mean_duration}m</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Queue Delay:</span>
                    <span className="font-semibold text-indigo-300 font-mono">{node.mean_queue_time}m</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">SLA Breach:</span>
                    <span className={`font-semibold font-mono ${node.sla_violation_rate > 10 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {node.sla_violation_rate}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Score:</span>
                    <span className={`font-bold font-mono ${isBottleneck ? 'text-amber-400' : 'text-slate-400'}`}>
                      {node.bottleneck_score}/100
                    </span>
                  </div>
                </div>

                {/* Click to inspect tip */}
                <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Info className="w-3 h-3" /> Click for details
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stage Detail Modal */}
      {selectedStage && (
        <StageDetailModal stage={selectedStage} onClose={() => setSelectedStage(null)} />
      )}
    </div>
  );
}
