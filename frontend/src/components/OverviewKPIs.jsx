import React from 'react';
import { Clock, ShieldAlert, CheckCircle2, Zap, Layers, AlertTriangle } from 'lucide-react';

export default function OverviewKPIs({ overview }) {
  if (!overview) return null;

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'WARNING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  const kpis = [
    {
      title: 'Total Process Events',
      value: overview.total_events ? overview.total_events.toLocaleString() : '12,000',
      subtitle: `${overview.total_cases || '2,000'} Order Cases Analyzed`,
      icon: Layers,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/20'
    },
    {
      title: 'Avg Lead Time',
      value: `${overview.avg_process_lead_time || '0.0'} min`,
      subtitle: `P95: ${overview.p95_process_lead_time || '0.0'} min`,
      icon: Clock,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20'
    },
    {
      title: 'SLA Compliance Rate',
      value: `${overview.overall_sla_compliance_rate || '0.0'}%`,
      subtitle: `${overview.overall_sla_compliance_rate < 80 ? 'Severe SLA Breach Risk' : 'Acceptable Performance'}`,
      icon: overview.overall_sla_compliance_rate >= 85 ? CheckCircle2 : ShieldAlert,
      color: overview.overall_sla_compliance_rate >= 85 ? 'text-emerald-400' : 'text-rose-400',
      bgColor: overview.overall_sla_compliance_rate >= 85 ? 'bg-emerald-500/10' : 'bg-rose-500/10',
      borderColor: overview.overall_sla_compliance_rate >= 85 ? 'border-emerald-500/20' : 'border-rose-500/20'
    },
    {
      title: 'Anomaly Rate (Isolation Forest)',
      value: `${overview.overall_anomaly_rate || '0.0'}%`,
      subtitle: 'Multivariate Outlier Density',
      icon: Zap,
      color: overview.overall_anomaly_rate > 10 ? 'text-amber-400' : 'text-cyan-400',
      bgColor: overview.overall_anomaly_rate > 10 ? 'bg-amber-500/10' : 'bg-cyan-500/10',
      borderColor: overview.overall_anomaly_rate > 10 ? 'border-amber-500/20' : 'border-cyan-500/20'
    },
    {
      title: 'Primary Bottleneck',
      value: overview.primary_bottleneck_stage || 'None',
      subtitle: overview.primary_bottleneck_severity,
      icon: AlertTriangle,
      badgeClass: getSeverityBadge(overview.primary_bottleneck_severity),
      color: overview.primary_bottleneck_severity === 'CRITICAL' ? 'text-red-400' : (overview.primary_bottleneck_severity === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'),
      bgColor: 'bg-slate-900',
      borderColor: overview.primary_bottleneck_severity === 'CRITICAL' ? 'border-red-500/40' : 'border-slate-800'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className={`bg-slate-900/90 border ${kpi.borderColor} rounded-xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden backdrop-blur-sm`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{kpi.title}</span>
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span className="truncate">{kpi.value}</span>
                {kpi.badgeClass && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${kpi.badgeClass}`}>
                    {kpi.subtitle}
                  </span>
                )}
              </div>
              {!kpi.badgeClass && (
                <p className="text-[11px] text-slate-400 mt-1">{kpi.subtitle}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
