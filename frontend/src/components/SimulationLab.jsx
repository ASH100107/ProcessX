import React, { useState, useEffect } from 'react';
import { Sliders, Play, TrendingUp, DollarSign, Clock, ShieldCheck, CheckCircle2, Cpu, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function SimulationLab({ catalog, onSimulationComplete }) {
  const [selectedId, setSelectedId] = useState('INT-PAY-01');
  const [customCost, setCustomCost] = useState(4200);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [portfolioResult, setPortfolioResult] = useState(null);
  const [budget, setBudget] = useState(12000);

  useEffect(() => {
    if (catalog && catalog.length > 0) {
      const initial = catalog.find((c) => c.id === selectedId) || catalog[0];
      setSelectedId(initial.id);
      setCustomCost(initial.monthly_cost);
    }
  }, [catalog]);

  const handleSelectIntervention = (intId) => {
    setSelectedId(intId);
    const found = catalog?.find((c) => c.id === intId);
    if (found) {
      setCustomCost(found.monthly_cost);
    }
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await api.simulateIntervention(selectedId, Number(customCost));
      setSimResult(res);
      if (onSimulationComplete) onSimulationComplete(res);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRunOptimization = async () => {
    setIsSimulating(true);
    try {
      const res = await api.optimizePortfolio(Number(budget), 2);
      setPortfolioResult(res);
    } catch (err) {
      console.error('Optimization error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            Intervention Simulation & OR-Tools Optimization Lab
          </h2>
          <p className="text-xs text-slate-400">
            Simulate operational modifications, stochastic queuing relief, and multi-objective ROI.
          </p>
        </div>
        <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md self-start">
          STOCHASTIC ENGINE
        </span>
      </div>

      {/* Control Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Selector & Parameters */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
              Candidate Intervention
            </label>
            <select
              value={selectedId}
              onChange={(e) => handleSelectIntervention(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg p-2.5 focus:outline-none focus:border-sky-500"
            >
              {(catalog || []).map((item) => (
                <option key={item.id} value={item.id} className="bg-slate-900 text-white">
                  [{item.id}] {item.name} ({item.target_stage})
                </option>
              ))}
            </select>

            {/* Selected description */}
            {catalog && (
              <div className="mt-3 p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-xs text-slate-300">
                <span className="font-semibold text-sky-400">Target: </span>
                {catalog.find((c) => c.id === selectedId)?.target_stage}
                <p className="text-[11px] text-slate-400 mt-1">
                  {catalog.find((c) => c.id === selectedId)?.description}
                </p>
              </div>
            )}

            {/* Monthly Cost Slider */}
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Monthly Cost:</span>
                <span className="font-mono font-bold text-white">${Number(customCost).toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="15000"
                step="250"
                value={customCost}
                onChange={(e) => setCustomCost(e.target.value)}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="flex-1 py-2.5 px-3 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs rounded-lg shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Simulate Action
            </button>
            <button
              onClick={handleRunOptimization}
              disabled={isSimulating}
              className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs rounded-lg shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5"
              title="Run OR-Tools Linear Solver"
            >
              <Cpu className="w-3.5 h-3.5" />
              MIP Optimize
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Before vs After & Impact Display */}
        <div className="lg:col-span-2 space-y-4">
          {simResult ? (
            <div>
              {/* Comparison Scoreboard */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-center">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Lead Time</span>
                  <div className="text-xs font-mono font-bold text-red-400 line-through mt-0.5">
                    {simResult.before.mean_duration}m
                  </div>
                  <div className="text-sm font-mono font-bold text-emerald-400">
                    {simResult.after.mean_duration}m
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Queue Delay</span>
                  <div className="text-xs font-mono font-bold text-red-400 line-through mt-0.5">
                    {simResult.before.mean_queue_time}m
                  </div>
                  <div className="text-sm font-mono font-bold text-indigo-400">
                    {simResult.after.mean_queue_time}m
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">SLA Breaches</span>
                  <div className="text-xs font-mono font-bold text-red-400 line-through mt-0.5">
                    {simResult.before.sla_violation_rate}%
                  </div>
                  <div className="text-sm font-mono font-bold text-emerald-400">
                    {simResult.after.sla_violation_rate}%
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Throughput</span>
                  <div className="text-xs font-mono font-bold text-slate-400 line-through mt-0.5">
                    {simResult.before.throughput_per_hr}/hr
                  </div>
                  <div className="text-sm font-mono font-bold text-sky-400">
                    {simResult.after.throughput_per_hr}/hr
                  </div>
                </div>
              </div>

              {/* Financial & ROI Impact Banner */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/40 p-4 rounded-xl border border-sky-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                      Business Value & ROI Quantification
                    </span>
                    <div className="text-xl font-extrabold text-white font-mono mt-0.5">
                      ROI: +{simResult.impact.roi_percentage}%
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Est. Monthly Gain: ${simResult.impact.monthly_benefit?.toLocaleString()} | Net Value: ${simResult.impact.net_profit_monthly?.toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right self-start sm:self-auto">
                    <span className="text-[10px] text-slate-400 block">Labor Time Recovered</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {simResult.impact.hours_saved_monthly} hrs/mo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6">
              <Sliders className="w-8 h-8 text-slate-700 mb-2" />
              <div className="text-xs font-bold text-slate-400">Simulation Engine Ready</div>
              <p className="text-[11px] text-slate-500 max-w-sm mt-1">
                Select an intervention above and click "Simulate Action" to evaluate queuing deltas and ROI.
              </p>
            </div>
          )}

          {/* OR-Tools Portfolio Banner if run */}
          {portfolioResult && (
            <div className="bg-indigo-950/30 border border-indigo-500/30 p-3.5 rounded-xl text-xs text-slate-300 animate-in fade-in duration-200">
              <div className="flex items-center justify-between font-bold text-indigo-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" /> OR-Tools Optimal Portfolio Selected:
                </span>
                <span className="font-mono">ROI: {portfolioResult.portfolio_roi_percentage}%</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Allocated ${portfolioResult.allocated_cost?.toLocaleString()} / ${portfolioResult.monthly_budget?.toLocaleString()} budget across {portfolioResult.selected_interventions_count} action(s). Net Profit: +${portfolioResult.total_net_profit_monthly?.toLocaleString()}/mo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
