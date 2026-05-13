"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { CalendarDays, GripVertical, User } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/crm/status-badge";

export type PipelineOpportunity = {
  id: string;
  title: string;
  estimatedValue: number;
  priority: string;
  expectedCloseDate: string | null;
  operationCode: string | null;
  operationalStatus: string | null;
  closedAt: string | null;
  lead: { fullName: string; eventType: string; estimatedDate: string | null };
  assignedUser: { name: string } | null;
};

export function OpportunityCard({ opportunity }: { opportunity: PipelineOpportunity }) {
  const locked = Boolean(opportunity.operationCode || opportunity.operationalStatus || opportunity.closedAt);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: opportunity.id, disabled: locked });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <motion.div layout ref={setNodeRef} style={style} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: locked ? 0 : -2 }} className={`rounded-lg border bg-white p-4 shadow-sm ${isDragging ? "opacity-70 ring-2 ring-primary" : ""} ${locked ? "bg-slate-50" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{opportunity.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{opportunity.lead.fullName} · {opportunity.lead.eventType}</p>
        </div>
        <button
          className={`rounded p-1 text-muted-foreground hover:bg-muted ${locked ? "cursor-not-allowed opacity-50" : "cursor-grab"}`}
          {...(!locked ? attributes : {})}
          {...(!locked ? listeners : {})}
          aria-label={locked ? "Oportunidad bloqueada" : "Mover oportunidad"}
          disabled={locked}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-3 text-base font-semibold">{formatCurrency(opportunity.estimatedValue)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge value={opportunity.priority} />
        <StatusBadge value={locked ? opportunity.operationalStatus ?? "Bloqueado comercial" : "Activo"} />
      </div>
      {opportunity.operationCode && <p className="mt-2 text-xs font-medium text-primary">{opportunity.operationCode}</p>}
      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
        <p className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" /> {opportunity.lead.estimatedDate ? format(new Date(opportunity.lead.estimatedDate), "dd MMM yyyy", { locale: es }) : "Sin fecha tentativa"}</p>
        <p className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> {opportunity.assignedUser?.name ?? "Sin responsable"}</p>
      </div>
    </motion.div>
  );
}
