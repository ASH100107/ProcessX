/**
 * Convert backend stage metrics into ProcessMap node format.
 * Works even when the API omits map_before/map_after (older backend).
 */

export function stagesToMap(stages, scenario = 'current') {
  if (!stages || stages.length === 0) return null;

  const nodes = stages
    .map((s) => ({
      id: s.stage.toLowerCase().replace(/\s+/g, '_'),
      name: s.stage,
      order: s.stage_order,
      health: s.health,
      severity: s.severity,
      bottleneck_score: s.bottleneck_score,
      mean_duration: s.mean_duration,
      sla_target: s.sla_target,
      mean_queue_time: s.mean_queue_time,
      mean_processing_time: s.mean_processing_time,
      utilization: s.resource_utilization,
      sla_violation_rate: s.sla_violation_rate,
      anomaly_rate: s.anomaly_rate_pct,
      throughput: s.throughput_per_hr,
      delay_contribution: s.delay_contribution_pct,
      evidence: s.evidence
    }))
    .sort((a, b) => a.order - b.order);

  const edges = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `edge_${nodes[i].id}_to_${nodes[i + 1].id}`,
      source: nodes[i].id,
      target: nodes[i + 1].id
    });
  }

  return { nodes, edges, scenario };
}

export function mapToStageLookup(mapData) {
  if (!mapData?.nodes) return {};
  return Object.fromEntries(
    mapData.nodes.map((n) => [
      n.name,
      {
        stage: n.name,
        health: n.health,
        severity: n.severity,
        bottleneck_score: n.bottleneck_score,
        mean_queue_time: n.mean_queue_time,
        mean_duration: n.mean_duration,
        sla_violation_rate: n.sla_violation_rate
      }
    ])
  );
}

export function buildHealthTransitions(stagesBefore, stagesAfter) {
  if (!stagesAfter?.length) return [];

  const healthOrder = { Healthy: 0, Warning: 1, Critical: 2 };
  const beforeLookup = stagesBefore?.length
    ? Object.fromEntries(stagesBefore.map((s) => [s.stage, s]))
    : {};

  return stagesAfter.map((after_s) => {
    const before_s = beforeLookup[after_s.stage] || {};
    const hb = before_s.health || 'Healthy';
    const ha = after_s.health;
    const improved = (healthOrder[ha] ?? 0) < (healthOrder[hb] ?? 0);
    const worsened = (healthOrder[ha] ?? 0) > (healthOrder[hb] ?? 0);

    return {
      stage: after_s.stage,
      health_before: hb,
      health_after: ha,
      severity_before: before_s.severity || 'HEALTHY',
      severity_after: after_s.severity,
      score_before: before_s.bottleneck_score ?? 0,
      score_after: after_s.bottleneck_score,
      queue_before: before_s.mean_queue_time ?? 0,
      queue_after: after_s.mean_queue_time,
      duration_before: before_s.mean_duration ?? 0,
      duration_after: after_s.mean_duration,
      sla_before: before_s.sla_violation_rate ?? 0,
      sla_after: after_s.sla_violation_rate,
      changed: hb !== ha,
      improved,
      worsened
    };
  });
}

/** Normalize re-eval API response — fills map_before/after & transitions if missing */
export function normalizeReEvalResult(result, fallbackMapBefore) {
  const map_before =
    result.map_before ||
    stagesToMap(result.stages_before) ||
    fallbackMapBefore;

  const map_after =
    result.map_after ||
    stagesToMap(result.stages_after);

  const stages_before =
    result.stages_before ||
    (map_before?.nodes
      ? map_before.nodes.map((n) => ({
          stage: n.name,
          stage_order: n.order,
          health: n.health,
          severity: n.severity,
          bottleneck_score: n.bottleneck_score,
          mean_queue_time: n.mean_queue_time,
          mean_duration: n.mean_duration,
          sla_violation_rate: n.sla_violation_rate
        }))
      : []);

  const health_transitions =
    result.health_transitions?.length
      ? result.health_transitions
      : buildHealthTransitions(stages_before, result.stages_after);

  return {
    ...result,
    map_before,
    map_after,
    stages_before,
    health_transitions
  };
}
