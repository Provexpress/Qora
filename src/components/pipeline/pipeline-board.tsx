"use client";

import { useMemo, useState, useTransition } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCorners, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { moveOpportunity } from "@/actions/opportunities";
import { PipelineOpportunity, OpportunityCard } from "@/components/pipeline/opportunity-card";
import { formatCurrency } from "@/lib/utils";

type Stage = { id: string; name: string; color: string; opportunities: PipelineOpportunity[] };

export function PipelineBoard({ stages }: { stages: Stage[] }) {
  const [localStages, setLocalStages] = useState(stages);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const stageIds = useMemo(() => new Set(localStages.map((stage) => stage.id)), [localStages]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const from = localStages.find((stage) => stage.opportunities.some((item) => item.id === activeId));
    const to = localStages.find((stage) => stage.id === overId || stage.opportunities.some((item) => item.id === overId));
    if (!from || !to || from.id === to.id) return;
    const moving = from.opportunities.find((item) => item.id === activeId);
    if (!moving) return;
    if (moving.operationCode || moving.operationalStatus || moving.closedAt) return;
    setLocalStages((current) =>
      current.map((stage) => {
        if (stage.id === from.id) return { ...stage, opportunities: stage.opportunities.filter((item) => item.id !== activeId) };
        if (stage.id === to.id) return { ...stage, opportunities: [moving, ...stage.opportunities] };
        return stage;
      })
    );
    if (stageIds.has(to.id)) startTransition(() => moveOpportunity(activeId, to.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {localStages.map((stage, index) => <PipelineColumn key={stage.id} stage={stage} index={index} />)}
      </div>
    </DndContext>
  );
}

function PipelineColumn({ stage, index }: { stage: Stage; index: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = stage.opportunities.reduce((sum, item) => sum + item.estimatedValue, 0);
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} ref={setNodeRef} className={`min-h-[520px] w-80 shrink-0 rounded-lg border bg-slate-50/80 p-3 ${isOver ? "ring-2 ring-primary" : ""}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color }} />
          <h2 className="text-sm font-semibold">{stage.name}</h2>
        </div>
        <span className="rounded-full bg-white px-2 py-1 text-xs text-muted-foreground">{stage.opportunities.length}</span>
      </div>
      <p className="mb-3 text-xs font-medium text-muted-foreground">{formatCurrency(total)}</p>
      <SortableContext items={stage.opportunities.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {stage.opportunities.map((opportunity) => <OpportunityCard key={opportunity.id} opportunity={opportunity} />)}
        </div>
      </SortableContext>
    </motion.section>
  );
}
