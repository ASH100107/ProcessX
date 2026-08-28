import React from 'react';
import { Play, Sparkles, Brain, Cpu, Database, RefreshCw, BarChart2, ShieldCheck } from 'lucide-react';

export default function Header({
  scenario,
  onSelectScenario,
  onRunInvestigation,
  isInvestigating,
  onOpenMLModal,
  health,
  onRefresh
}) {
  const scenarios = [
    { id: 'payment_verification_bottleneck', label: 'Payment Bottleneck (Scenario 1)' },
    { id: 'packing_bottleneck', label: 'Packing Bottleneck (Scenario 2)' },
    { id: 'unknown_inventory_bottleneck', label: 'Unknown Bottleneck (Scenario 3 - Inventory)' },
    { id: 'normal', label: 'Normal Baseline (Healthy)' }
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-sky-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Process<span className="text-sky-400">X</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
                AI INVESTIGATOR
              </span>
            </div>
            <p className="text-xs text-slate-400">Autonomous Business Bottleneck Investigator</p>
          </div>
        </div>

        {/* Controls & Actions */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Scenario Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 shadow-inner">
            <Database className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <select
              value={scenario}
              onChange={(e) => onSelectScenario(e.target.value)}
              disabled={isInvestigating}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-2 font-medium"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* ML Insights Button */}
          <button
            onClick={onOpenMLModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
            title="Inspect trained ML models & metrics"
          >
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            <span>ML Models</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isInvestigating}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-700 transition"
            title="Reload telemetry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* RUN INVESTIGATION BUTTON */}
          <button
            onClick={onRunInvestigation}
            disabled={isInvestigating}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white shadow-lg transition duration-200 ${
              isInvestigating
                ? 'bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 shadow-sky-500/25 active:scale-95'
            }`}
          >
            {isInvestigating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                <span>INVESTIGATING...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>RUN AUTONOMOUS INVESTIGATION</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
