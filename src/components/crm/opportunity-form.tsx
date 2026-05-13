"use client";

import { useState, useTransition } from "react";
import { BriefcaseBusiness, Loader2 } from "lucide-react";
import { createOpportunityFromLead } from "@/actions/leads";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function OpportunityForm({ lead, stages, users }: { lead: { id: string; fullName: string; eventType: string }; stages: { id: string; name: string }[]; users: { id: string; name: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><BriefcaseBusiness className="h-4 w-4" /> Oportunidad</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Crear oportunidad para {lead.fullName}</DialogTitle></DialogHeader>
        <form
          action={(formData) => startTransition(async () => {
            await createOpportunityFromLead(formData);
            setOpen(false);
          })}
          className="grid gap-4 md:grid-cols-2"
        >
          <input type="hidden" name="leadId" value={lead.id} />
          <Field label="Título"><Input name="title" defaultValue={`${lead.eventType} - ${lead.fullName}`} /></Field>
          <Field label="Etapa">
            <select name="stageId" className="h-10 w-full rounded-md border bg-white px-3 text-sm">{stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select>
          </Field>
          <Field label="Valor estimado"><Input name="estimatedValue" type="number" defaultValue={12000000} /></Field>
          <Field label="Prioridad"><select name="priority" className="h-10 w-full rounded-md border bg-white px-3 text-sm"><option>Alta</option><option>Media</option><option>Baja</option></select></Field>
          <Field label="Cierre esperado"><Input name="expectedCloseDate" type="date" /></Field>
          <Field label="Responsable"><select name="assignedUserId" className="h-10 w-full rounded-md border bg-white px-3 text-sm">{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></Field>
          <Field label="Notas" className="md:col-span-2"><Textarea name="notes" /></Field>
          <div className="md:col-span-2 flex justify-end"><Button disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />} Crear</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return <div className={className}><Label>{label}</Label><div className="mt-1.5">{children}</div></div>;
}
