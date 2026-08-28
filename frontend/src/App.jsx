import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  X,
  Brain,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { api } from './services/api';
import Header from './components/Header';
import OverviewKPIs from './components/OverviewKPIs';
import ProcessMap from './components/ProcessMap';
import BottleneckTable from './components/BottleneckTable';
import DelayCauseBreakdown from './components/DelayCauseBreakdown';
import InvestigationTree from './components/InvestigationTree';
import ActivityFeed from './components/ActivityFeed';
import SimulationLab from './components/SimulationLab';
import RecommendationCard from './components/RecommendationCard';
import BaselineComparison from './components/BaselineComparison';

const DEFAULT_SCENARIO = 'payment_verification_bottleneck';

function MLMetricsModal({ metrics, onClose }) {
  if (!metrics) return null;
  const dp = metrics.duration_predictor || {};
  const ad = metrics.anomaly_detector || {};
  const dc = metrics.delay_classifier || {};

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">ML Model Evaluation Metrics</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold text-sky-400 uppercase mb-3">Duration Predictor</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">MAE</span><span className="font-mono font-bold text-white">{dp.mae} min</span></div>
              <div className="flex justify-between"><span className="text-slate-400">RMSE</span><span className="font-mono font-bold text-white">{dp.rmse} min</span></div>
              <div className="flex justify-between"><span className="text-slate-400">R²</span><span className="font-mono font-bold text-emerald-400">{dp.r2}</span></div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold text-amber-400 uppercase mb-3">Anomaly Detector</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Anomaly Count</span><span className="font-mono font-bold text-white">{ad.anomaly_count?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Anomaly Rate</span><span className="font-mono font-bold text-amber-400">{ad.anomaly_percentage}%</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Contamination</span><span className="font-mono font-bold text-white">{ad.contamination}</span></div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold text-indigo-400 uppercase mb-3">Delay-Cause Classifier</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Accuracy</span><span className="font-mono font-bold text-white">{(dc.accuracy * 100).toFixed(1)}%</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Precision</span><span className="font-mono font-bold text-white">{(dc.precision * 100).toFixed(1)}%</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Recall</span><span className="font-mono font-bold text-white">{(dc.recall * 100).toFixed(1)}%</span></div>
              <div className="flex justify-between"><span className="text-slate-400">F1 Score</span><span className="font-mono font-bold text-emerald-400">{dc.f1_score}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcessHealthBanner({ overview, health }) {
  if (!overview) return null;

  const severity = overview.primary_bottleneck_severity;
  const isHealthy = severity === 'HEALTHY';
  const isCritical = severity === 'CRITICAL';

  return (
    <div className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
      isHealthy
        ? 'bg-emerald-950/30 border-emerald-500/30'
        : isCritical
        ? 'bg-red-950/30 border-red-500/30'
        : 'bg-amber-950/30 border-amber-500/30'
    }`}>
      <div className="flex items-center gap-3">
        {isHealthy ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
        ) : (
          <ShieldAlert className={`w-6 h-6 shrink-0 ${isCritical ? 'text-red-400' : 'text-amber-400'}`} />
        )}
        <div>
          <h2 className="text-sm font-bold text-white">
            Overall Process Health: {isHealthy ? 'Healthy' : isCritical ? 'Critical' : 'Degraded'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Scenario: <span className="text-slate-200 font-medium">{overview.scenario?.replace(/_/g, ' ')}</span>
            {' · '}Primary bottleneck: <span className="font-semibold text-white">{overview.primary_bottleneck_stage}</span>
            {' · '}SLA compliance: <span className="font-mono text-sky-400">{overview.overall_sla_compliance_rate}%</span>
          </p>
        </div>
      </div>
      {health && (
        <div className="flex items-center gap-2 text-xs">
          <span className={`px-2 py-1 rounded-md font-mono font-bold ${
            health.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400'
          }`}>
            API {health.status?.toUpperCase()}
          </span>
          {health.models_loaded && (
            <span className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/30 font-mono">
              ML READY
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [scenario, setScenario] = useState(DEFAULT_SCENARIO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [showMLModal, setShowMLModal] = useState(false);

  const [health, setHealth] = useState(null);
  const [overview, setOverview] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [delayCauses, setDelayCauses] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [baseline, setBaseline] = useState(null);
  const [mlMetrics, setMlMetrics] = useState(null);
  const [investigation, setInvestigation] = useState(null);
  const [reEvalResult, setReEvalResult] = useState(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthRes, overviewRes, mapRes, bnRes, dcRes, catRes, mlRes] = await Promise.all([
        api.getHealth(),
        api.getOverview(),
        api.getProcessMap(),
        api.getBottlenecks(),
        api.getDelayCauses(),
        api.getCatalog(),
        api.getMLMetrics()
      ]);
      setHealth(healthRes);
      setOverview(overviewRes);
      setMapData(mapRes);
      setBottlenecks(bnRes);
      setDelayCauses(dcRes);
      setCatalog(catRes);
      setMlMetrics(mlRes.metrics);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleSelectScenario = async (newScenario) => {
    setScenario(newScenario);
    setInvestigation(null);
    setReEvalResult(null);
    setBaseline(null);
    setLoading(true);
    setError(null);
    try {
      await api.injectScenario(newScenario);
      await loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to inject scenario');
      setLoading(false);
    }
  };

  const handleRunInvestigation = async () => {
    setIsInvestigating(true);
    setError(null);
    setReEvalResult(null);
    try {
      const result = await api.startInvestigation(scenario);
      setInvestigation(result);
      const baselineRes = await api.getBaselineComparison();
      setBaseline(baselineRes);
    } catch (err) {
      setError(err.message || 'Investigation failed');
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleApplyIntervention = async (interventionId) => {
    if (!interventionId) return;
    setIsApplying(true);
    setError(null);
    try {
      const result = await api.reEvaluateProcess(interventionId);
      setReEvalResult(result);
      await loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to apply intervention');
    } finally {
      setIsApplying(false);
    }
  };

  const recommendedAction = investigation?.recommended_action;

  return (
    <div className="min-h-screen bg-slate-950">
      <Header
        scenario={scenario}
        onSelectScenario={handleSelectScenario}
        onRunInvestigation={handleRunInvestigation}
        isInvestigating={isInvestigating}
        onOpenMLModal={() => setShowMLModal(true)}
        health={health}
        onRefresh={loadDashboardData}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {error && (
          <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 flex items-center gap-3 text-sm text-red-300">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
            <button onClick={loadDashboardData} className="ml-auto text-xs font-bold text-red-400 hover:text-red-300 underline">
              Retry
            </button>
          </div>
        )}

        {loading && !overview ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-sky-400 mb-4" />
            <p className="text-sm font-medium">Loading ProcessX telemetry from backend...</p>
          </div>
        ) : (
          <>
            <ProcessHealthBanner overview={overview} health={health} />
            <OverviewKPIs overview={overview} />
            <ProcessMap mapData={mapData} />
            <BottleneckTable bottlenecks={bottlenecks} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DelayCauseBreakdown delayCausesData={delayCauses} mlMetrics={mlMetrics} />
              <ActivityFeed timeline={investigation?.timeline || []} />
            </div>

            <InvestigationTree investigation={investigation} />

            {recommendedAction && (
              <div className="space-y-4">
                <RecommendationCard recommendation={recommendedAction} />
                <div className="flex justify-end">
                  <button
                    onClick={() => handleApplyIntervention(recommendedAction.intervention?.id)}
                    disabled={isApplying}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
                  >
                    {isApplying ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Applying & Re-evaluating...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Apply Recommended Intervention & Re-evaluate</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {reEvalResult && (
              <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-4 text-sm">
                <h3 className="font-bold text-cyan-300 mb-2">Post-Intervention Re-evaluation Complete</h3>
                <p className="text-slate-300 text-xs">
                  Applied <strong>{reEvalResult.applied_intervention?.name}</strong> to <strong>{reEvalResult.target_stage}</strong>.
                  {reEvalResult.bottleneck_shifted
                    ? ` Bottleneck shifted to ${reEvalResult.new_primary_bottleneck} (${reEvalResult.new_primary_severity}).`
                    : ' Target stage normalized. Process stabilized.'}
                </p>
              </div>
            )}

            <SimulationLab catalog={catalog} />

            {baseline && <BaselineComparison comparisonData={baseline} mlMetrics={mlMetrics} />}
          </>
        )}
      </main>

      {showMLModal && (
        <MLMetricsModal metrics={mlMetrics} onClose={() => setShowMLModal(false)} />
      )}
    </div>
  );
}
