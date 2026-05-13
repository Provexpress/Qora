import { AppShell } from "@/components/layout/app-shell";
import { ModuleHero } from "@/components/layout/module-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { salesOpportunityScope } from "@/lib/scopes";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const currentUser = await requireModuleAccess("pipeline");
  const stages = await prisma.pipelineStage.findMany({
    orderBy: { order: "asc" },
    include: { opportunities: { where: salesOpportunityScope(currentUser), orderBy: { updatedAt: "desc" }, include: { lead: true, assignedUser: true } } }
  });
  const parsed = stages.map((stage) => ({
    ...stage,
    opportunities: stage.opportunities.map((opp) => ({
      id: opp.id,
      title: opp.title,
      estimatedValue: Number(opp.estimatedValue),
      priority: opp.priority,
      expectedCloseDate: opp.expectedCloseDate?.toISOString() ?? null,
      operationCode: opp.operationCode,
      operationalStatus: opp.operationalStatus,
      closedAt: opp.closedAt?.toISOString() ?? null,
      lead: { fullName: opp.lead.fullName, eventType: opp.lead.eventType, estimatedDate: opp.lead.estimatedDate?.toISOString() ?? null },
      assignedUser: opp.assignedUser ? { name: opp.assignedUser.name } : null
    }))
  }));
  const allOpportunities = parsed.flatMap((stage) => stage.opportunities);
  const pipelineValue = allOpportunities.reduce((sum, opportunity) => sum + opportunity.estimatedValue, 0);
  const hotOpportunities = allOpportunities.filter((opportunity) => opportunity.priority === "Alta").length;

  return (
    <AppShell title="Pipeline comercial" module="pipeline">
      <PageTransition>
        <ModuleHero
          eyebrow="Gestión de oportunidades"
          title="Kanban comercial para priorizar, mover y cerrar negocios con claridad."
          description="Cada tarjeta conserva contexto del cliente, evento, responsable, prioridad y valor estimado para facilitar una gestión comercial fluida."
          metrics={[
            { label: "Oportunidades", value: String(allOpportunities.length), helper: "En tablero" },
            { label: "Valor pipeline", value: formatCurrency(pipelineValue), helper: "Estimado" },
            { label: "Alta prioridad", value: String(hotOpportunities), helper: "Atención inmediata" },
            { label: "Etapas", value: String(parsed.length), helper: "Flujo configurado" }
          ]}
        />
        <PipelineBoard stages={parsed} />
      </PageTransition>
    </AppShell>
  );
}
