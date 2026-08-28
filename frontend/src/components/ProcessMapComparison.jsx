import React from 'react';
import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  Layers
} from 'lucide-react';
import ProcessMap from './ProcessMap';

function healthColor(health) {
  switch (health) {
    case 'Critical': return 'text-red-400';
    case 'Warning': return 'text-amber-400';
    default: return 'text-emerald-400';
  }
}

function TransitionRow({ t }) {
  const Icon = t.improved ? TrendingDown : t.worsened ? TrendingUp : Minus;
  const iconColor = t.improved ? 'text-emerald-400' : t.worsened ? 'text-amber-400' : 'text-slate-500';

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border ${
      t.changed
        ? t.improved
          ? 'bg-emerald-950/30 border-emerald-500/30'
          : t.worsened
          ? 'bg-amber-950/30 border-amber-500/30'
          : 'bg-slate-900 border-slate-700'
        : 'bg-slate-900/50 border-slate-800'
    }`}>
      <div className="flex items-center gap-2 min-w-0">
        <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
        <span className="text-sm font-semibold text-white truncate">{t.stage}</span>
      </div>
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className={`font-bold ${healthColor(t.health_before)}`}>{t.health_before}</span>
        <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span className={`font-bold ${healthColor(t.health_after)}`}>{t.health_after}</span>
      </div>
      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300">
        <span>Queue: <span className="text-slate-400 line-through">{t.queue_before}m</span> → <span className="text-sky-300 font-bold">{t.queue_after}m</span></span>
        <span>Score: <span className="text-slate-400">{t.score_before}</span> → <span className="text-white font-bold">{t.score_after}</span></span>
      </div>
    </div>
  );
}

function buildWhyBetter(entry, step, originalMap) {
  const { impact, health_transitions = [], target_stage, applied_intervention, bottleneck_shifted, new_primary_bottleneck } = entry;
  const improved = health_transitions.filter((t) => t.improved);
  const worsened = health_transitions.filter((t) => t.worsened);
  const reasons = [];

  reasons.push(
    `Applied "${applied_intervention?.name}" to ${target_stage} — the agent identified this as the highest-ROI action for the current process state.`
  );

  if (impact) {
    reasons.push(
      `Business case: ${impact.roi_percentage}% ROI, $${impact.monthly_benefit?.toLocaleString()}/mo benefit, ${impact.duration_reduction_pct}% duration reduction, and ${impact.sla_improvement_points}pt SLA recovery on the target stage.`
    );
  }

  if (improved.length > 0) {
    reasons.push(
      `Health improved on ${improved.map((t) => `${t.stage} (${t.health_before} → ${t.health_after}, queue ${t.queue_before}m → ${t.queue_after}m)`).join('; ')}.`
    );
  }

  if (worsened.length > 0) {
    reasons.push(
      `Downstream effect: ${worsened.map((t) => `${t.stage} moved ${t.health_before} → ${t.health_after} as backlog transferred`).join('; ')} — this is expected when upstream throughput increases.`
    );
  }

  if (bottleneck_shifted && new_primary_bottleneck) {
    reasons.push(
      `Bottleneck shifted to ${new_primary_bottleneck}. A follow-up intervention on that stage would be the next optimal step.`
    );
  }

  if (step === 1 && originalMap?.nodes) {
    const origCritical = originalMap.nodes.filter((n) => n.health === 'Critical').map((n) => n.name);
    if (origCritical.length && improved.some((t) => origCritical.includes(t.stage))) {
      reasons.push(
        `Compared to the original baseline, this evaluation clears critical congestion that was blocking ${origCritical.join(', ')}.`
      );
    }
  }

  if (step > 1) {
    reasons.push(
      `This is evaluation #${step} — it builds on the previous intervention, further optimizing the process from its already-improved state.`
    );
  }

  return reasons;
}

function attachTransitions(mapData, health_transitions) {
  if (!mapData?.nodes) return mapData;
  const transitionByStage = Object.fromEntries((health_transitions || []).map((t) => [t.stage, t]));
  return {
    ...mapData,
    nodes: mapData.nodes.map((n) => ({
      ...n,
      transition: transitionByStage[n.name] || null
    }))
  };
}

function StepDivider({ step, interventionName }) {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      <div className="flex items-center gap-2 px-4 py-2.5 bg-cyan-950/50 border border-cyan-500/40 rounded-full">
        <ArrowDown className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-bold text-cyan-300">
          Apply #{step}: {interventionName}
        </span>
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
    </div>
  );
}

function WhyBetterPanel({ reasons, entry, step }) {
  const improved = (entry.health_transitions || []).filter((t) => t.improved);
  const changed = (entry.health_transitions || []).filter((t) => t.changed);

  return (
    <div className="bg-slate-900 border border-slate-600 rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-white">
            Evaluation #{step} — What Changed & Why This Is Better
          </h4>
          <ul className="mt-2 space-y-1.5">
            {reasons.map((r, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {changed.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-700">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stage transitions this step</p>
          {changed.map((t) => (
            <TransitionRow key={t.stage} t={t} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {improved.length > 0 && (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg">
            {improved.length} improved
          </span>
        )}
        {entry.impact && (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 rounded-lg font-mono">
            ROI +{entry.impact.roi_percentage}%
          </span>
        )}
      </div>
    </div>
  );
}

export default function ProcessMapComparison({ originalMap, history = [] }) {
  const resolvedOriginal = originalMap || history[0]?.map_before;

  if (!resolvedOriginal?.nodes?.length || history.length === 0) {
    return (
      <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-6 text-center text-sm text-amber-200">
        Waiting for process map data from re-evaluation…
      </div>
    );
  }

  const latest = history[history.length - 1];
  const totalImproved = history.reduce((acc, h) => acc + (h.health_transitions || []).filter((t) => t.improved).length, 0);

  return (
    <div className="space-y-6">
      {/* Cumulative header */}
      <div className="bg-gradient-to-r from-indigo-950/50 via-slate-900 to-cyan-950/30 border border-indigo-500/30 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Layers className="w-6 h-6 text-indigo-400 shrink-0" />
          <div>
            <h3 className="text-base font-bold text-white">
              Process Evolution Timeline — {history.length + 1} States
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              1 original baseline + {history.length} intervention{history.length > 1 ? 's' : ''} applied.
              Scroll down — each section has its own full Autonomous Process Flow Map.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-2.5 py-1 text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-600 rounded-lg">
                {history.length} evaluation{history.length > 1 ? 's' : ''} completed
              </span>
              <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg">
                {totalImproved} total stage improvements
              </span>
              {latest?.new_primary_bottleneck && (
                <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-lg">
                  Current bottleneck: {latest.new_primary_bottleneck || latest.map_after?.nodes?.[0]?.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ORIGINAL — always first, never replaced */}
      <ProcessMap
        mapData={resolvedOriginal}
        title="Original — Autonomous Process Flow Map (Baseline)"
        subtitle="Starting process state before any intervention was applied"
        variant="before"
      />

      {/* Each apply step stacks a new after-map */}
      {history.map((entry, idx) => {
        const step = entry.step || idx + 1;
        const reasons = buildWhyBetter(entry, step, resolvedOriginal);
        const afterMapData = entry.map_after || null;
        if (!afterMapData?.nodes?.length) return null;

        const afterMap = attachTransitions(afterMapData, entry.health_transitions || []);

        return (
          <React.Fragment key={`eval-${step}-${entry.applied_intervention?.id || idx}`}>
            <StepDivider step={step} interventionName={entry.applied_intervention?.name || 'Intervention'} />
            <WhyBetterPanel reasons={reasons} entry={entry} step={step} />
            <ProcessMap
              mapData={afterMap}
              title={`After Evaluation #${step} — Autonomous Process Flow Map`}
              subtitle={`Process state after "${entry.applied_intervention?.name}". Look for Critical → Healthy badges on improved stages.`}
              variant="after"
              showTransitions
            />
            {/* Visual separator between stacked maps */}
            {idx < history.length - 1 && (
              <div className="h-2" aria-hidden="true" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
