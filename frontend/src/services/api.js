/**
 * ProcessX API Client
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errBody.detail || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  getHealth: () => request('/health'),
  getOverview: () => request('/process/overview'),
  getProcessMap: () => request('/process/map'),
  getStages: () => request('/stages'),
  getBottlenecks: () => request('/bottlenecks'),
  getAnomalies: () => request('/anomalies'),
  getDelayCauses: () => request('/delay-causes'),
  
  startInvestigation: (scenario = null, monthlyBudget = 12000) =>
    request('/investigation/start', {
      method: 'POST',
      body: JSON.stringify({ scenario, monthly_budget: monthlyBudget })
    }),
    
  getInvestigation: (id) => request(`/investigation/${id}`),
  
  getCatalog: () => request('/interventions/catalog'),
  
  simulateIntervention: (interventionId, customCost = null) =>
    request('/interventions/simulate', {
      method: 'POST',
      body: JSON.stringify({ intervention_id: interventionId, custom_cost: customCost })
    }),
    
  optimizePortfolio: (monthlyBudget = 12000, maxInterventions = 3) =>
    request('/interventions/optimize', {
      method: 'POST',
      body: JSON.stringify({ monthly_budget: monthlyBudget, max_interventions: maxInterventions })
    }),
    
  reEvaluateProcess: (appliedInterventionId) =>
    request('/process/re-evaluate', {
      method: 'POST',
      body: JSON.stringify({ applied_intervention_id: appliedInterventionId })
    }),
    
  getBaselineComparison: () => request('/baseline/comparison'),
  
  listScenarios: () => request('/scenario/list'),
  
  injectScenario: (scenario) =>
    request('/scenario/inject', {
      method: 'POST',
      body: JSON.stringify({ scenario })
    }),
    
  getMLMetrics: () => request('/ml/metrics')
};
