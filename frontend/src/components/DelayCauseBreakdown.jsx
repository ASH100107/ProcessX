import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList
} from 'recharts';
import { PieChart as PieIcon, ShieldCheck } from 'lucide-react';

const COLORS = ['#38bdf8', '#818cf8', '#f472b6', '#fbbf24', '#34d399', '#a78bfa', '#fb7185', '#94a3b8'];

function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, value }) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#ffffff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {value}%
    </text>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-white text-xs font-bold mb-1">{item.name || label}</p>
      <p className="text-sky-300 text-sm font-mono font-bold">{item.value}%</p>
      <p className="text-slate-300 text-[11px]">{item.count} cases</p>
      {item.confidence != null && (
        <p className="text-emerald-300 text-[11px]">Confidence: {Math.round(item.confidence * 100)}%</p>
      )}
    </div>
  );
}

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

  const axisStyle = { fill: '#e2e8f0', fontSize: 11, fontWeight: 600 };
  const gridStyle = { stroke: '#475569', strokeDasharray: '3 3' };

  return (
    <div className="bg-slate-800/80 border border-slate-600 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-sky-400" />
              ML Delay-Cause Diagnostics
            </h2>
            <p className="text-xs text-slate-300">
              Multiclass Gradient Boosting predictions with feature attribution.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs">
            <select
              value={activeStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              {stageKeys.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-white">
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-slate-300">
            No anomalous delays flagged for this stage.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart — lighter panel */}
            <div className="bg-slate-900/90 border border-slate-600 rounded-xl p-4 h-64">
              <p className="text-xs font-semibold text-slate-200 mb-2">Distribution by Cause</p>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={renderPieLabel}
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#1e293b" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart — queue / cause percentages */}
            <div className="bg-slate-900/90 border border-slate-600 rounded-xl p-4 h-64">
              <p className="text-xs font-semibold text-slate-200 mb-2">Cause Breakdown (%)</p>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                  <CartesianGrid {...gridStyle} horizontal={false} />
                  <XAxis type="number" tick={axisStyle} axisLine={{ stroke: '#64748b' }} domain={[0, 'auto']} unit="%" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fill: '#f1f5f9', fontSize: 10, fontWeight: 600 }}
                    axisLine={{ stroke: '#64748b' }}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(56, 189, 248, 0.1)' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                    <LabelList dataKey="value" position="right" fill="#ffffff" fontSize={11} fontWeight={700} formatter={(v) => `${v}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend list */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {chartData.map((c, i) => (
                <div key={i} className="bg-slate-900 border border-slate-600 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/20" style={{ backgroundColor: c.color }} />
                    <div>
                      <div className="text-sm font-semibold text-white">{c.name}</div>
                      <div className="text-xs text-slate-300">
                        Confidence: {Math.round((c.confidence || 0.85) * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-mono font-bold text-sky-300">{c.value}%</div>
                    <div className="text-xs text-slate-300 font-mono">{c.count} cases</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {mlMetrics?.delay_classifier && (
        <div className="mt-4 pt-3 border-t border-slate-600 flex items-center text-xs text-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400 mr-1.5" />
          Model Accuracy: {(mlMetrics.delay_classifier.accuracy * 100).toFixed(1)}%
          {' '}(F1: {mlMetrics.delay_classifier.f1_score})
        </div>
      )}
    </div>
  );
}
