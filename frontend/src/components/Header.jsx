import React from 'react';

const SECTION_TITLES = {
  overview: 'Dashboard Overview',
  'process-map': 'Process Flow Map',
  bottlenecks: 'Bottleneck Analysis',
  investigation: 'Autonomous Investigation',
  simulation: 'Intervention Simulation',
  baseline: 'Baseline Comparison'
};

export default function Header({ activeSection, overview }) {
  const title = SECTION_TITLES[activeSection] || 'ProcessX Dashboard';

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="pl-10 lg:pl-0">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          {overview && (
            <p className="text-xs text-slate-400 mt-0.5">
              {overview.scenario?.replace(/_/g, ' ')}
              {' · '}
              {overview.total_events?.toLocaleString()} events
              {' · '}
              Primary bottleneck: <span className="text-sky-400 font-medium">{overview.primary_bottleneck_stage}</span>
            </p>
          )}
        </div>
        {overview && (
          <div className="flex items-center gap-2 text-xs self-start sm:self-auto">
            <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-mono">
              SLA {overview.overall_sla_compliance_rate}%
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-mono">
              Anomaly {overview.overall_anomaly_rate}%
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
