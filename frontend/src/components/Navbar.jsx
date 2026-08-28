import React, { useState } from 'react';
import {
  Sparkles,
  LayoutDashboard,
  Map,
  ShieldAlert,
  GitBranch,
  Sliders,
  Scale,
  Brain,
  RefreshCw,
  Play,
  Database,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'process-map', label: 'Process Map', icon: Map },
  { id: 'bottlenecks', label: 'Bottlenecks', icon: ShieldAlert },
  { id: 'investigation', label: 'Investigation', icon: GitBranch },
  { id: 'simulation', label: 'Simulation', icon: Sliders },
  { id: 'baseline', label: 'Baseline', icon: Scale }
];

const SCENARIOS = [
  { id: 'payment_verification_bottleneck', label: 'Payment Bottleneck' },
  { id: 'packing_bottleneck', label: 'Packing Bottleneck' },
  { id: 'unknown_inventory_bottleneck', label: 'Unknown / Inventory' },
  { id: 'normal', label: 'Normal Baseline' }
];

export default function Navbar({
  activeSection,
  onNavigate,
  scenario,
  onSelectScenario,
  onRunInvestigation,
  isInvestigating,
  onOpenMLModal,
  onRefresh,
  health
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (sectionId) => {
    onNavigate(sectionId);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-800 ${collapsed ? 'justify-center' : ''}`}>
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-sky-500/20 shrink-0">
          <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-sky-400" />
          </div>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white truncate">
              Process<span className="text-sky-400">X</span>
            </h1>
            <p className="text-[10px] text-slate-500 truncate">AI Investigator</p>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => handleNav(id)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : ''}`} />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom Controls */}
      <div className={`border-t border-slate-800 p-3 space-y-2 ${collapsed ? 'px-2' : ''}`}>
        {!collapsed && (
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2">
            <Database className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={scenario}
              onChange={(e) => onSelectScenario(e.target.value)}
              disabled={isInvestigating}
              className="bg-transparent text-[11px] text-slate-200 focus:outline-none cursor-pointer w-full font-medium"
            >
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900">
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={`flex gap-1.5 ${collapsed ? 'flex-col items-center' : ''}`}>
          <button
            onClick={onOpenMLModal}
            title="ML Models"
            className={`flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition ${
              collapsed ? 'p-2' : 'flex-1 py-2 px-2'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            {!collapsed && <span>ML</span>}
          </button>
          <button
            onClick={onRefresh}
            disabled={isInvestigating}
            title="Refresh"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={onRunInvestigation}
          disabled={isInvestigating}
          title="Run Investigation"
          className={`w-full flex items-center justify-center gap-2 rounded-lg text-xs font-bold text-white transition ${
            collapsed ? 'p-2.5' : 'py-2.5 px-3'
          } ${
            isInvestigating
              ? 'bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 shadow-lg shadow-sky-500/20'
          }`}
        >
          {isInvestigating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          {!collapsed && (
            <span>{isInvestigating ? 'Investigating...' : 'Run Investigation'}</span>
          )}
        </button>

        {!collapsed && health && (
          <div className="flex items-center gap-1.5 pt-1">
            <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded ${
              health.status === 'healthy'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/10 text-red-400'
            }`}>
              API {health.status?.toUpperCase()}
            </span>
            {health.models_loaded && (
              <span className="px-2 py-0.5 text-[9px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded">
                ML
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — desktop */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen bg-slate-900 border-r border-slate-800 z-30 transition-all duration-200 ${
          collapsed ? 'w-[68px]' : 'w-60'
        }`}
      >
        {sidebarContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Sidebar — mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-screen w-64 bg-slate-900 border-r border-slate-800 z-50 flex flex-col transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
