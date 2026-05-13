export const closedLeadStatuses = ["Cerrado", "Perdido", "Lead perdido"] as const;

export const operationalStageNames = ["Ganado / Operación", "Confirmado"] as const;

export function isClosedLeadStatus(status: string) {
  return closedLeadStatuses.includes(status as (typeof closedLeadStatuses)[number]);
}

export function isOperationalStage(stageName: string) {
  return operationalStageNames.includes(stageName as (typeof operationalStageNames)[number]);
}

export function isCommerciallyLockedOpportunity(opportunity: { operationCode?: string | null; operationalStatus?: string | null; closedAt?: Date | string | null }) {
  return Boolean(opportunity.operationCode || opportunity.operationalStatus || opportunity.closedAt);
}
