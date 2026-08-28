import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { HelpCircle, PieChart as PieIcon, BarChart3, ShieldCheck } from 'lucide-react';

const COLORS = ['#38bdf8', '#818cf8', '#f472b6', '#fbbf24', '#34d399', '#a78bfa', '#fb7185', '#94a3b8'];

export default function DelayCauseBreakdown({ delayCausesData, mlMetrics }) {
  const [selectedStage, setSelectedStage] = useState('Payment Verification');

  if (!delayCausesData || !delayCausesData.stage_causes) return null;

  const stageKeys = Object.keys(delayCausesData.stage_causes);
  const activeStage = stageKeys.includes(selectedStage) ? selectedStage : (stageKeys[0] || 'Payment Verification');
  const causesList = delayCausesData.stage_causes[activeStage] || [];

  const chartData = causesList.map((item, idx) => ({
    name: item.cause,
    value: item.percentage,
    count: item.count,
    confidence: item.average_confidence,
    color: COLORS[idx % COLORS.length]
  }));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm backdrop-blur-sm flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-sky-400" />
              ML Delay-Cause Diagnostics
            </h2>
            <p className="text-xs text-slate-400">
              Multiclass Gradient Boosting predictions with feature attribution.
            </p>
          </div>

          {/* Stage Selector */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <select
              value={activeStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              {stageKeys.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-slate-200">
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Charts & Breakdown */}
        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-500">
            No anomalous delays flagged for this stage.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Pie Chart */}
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#090d16" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }}
                    formatter={(val, name, item) => [`${val}% (${item.payload.count} cases)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* List breakdown */}
            <div className="space-y-2">
              {chartData.slice(0, 4).map((c, i) => (
                <div key={i} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <div>
                      <div className="text-xs font-semibold text-white">{c.name}</div>
                      <div className="text-[10px] text-slate-400">
                        Confidence: {Math.round((c.confidence || 0.85) * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-white">{c.value}%</div>
                    <div className="text-[10px] text-slate-500 font-mono">{c.count} cases</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {mlMetrics?.delay_classifier && (
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            Model Accuracy: {(mlMetrics.delay_classifier.accuracy * 100).toFixed(1)}%
            {' '}(F1: {mlMetrics.delay_classifier.f1_score})
          </span>
        </div>
      )}
    </div>
  );
}
