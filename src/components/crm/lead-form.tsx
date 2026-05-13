"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { createLead, updateLead } from "@/actions/leads";
import { leadSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type UserOption = { id: string; name: string };
type LeadFormValues = z.infer<typeof leadSchema>;
type LeadFormInitial = Partial<LeadFormValues> & { id?: string };

export function LeadForm({ users, lead }: { users: UserOption[]; lead?: LeadFormInitial }) {
  const [pending, startTransition] = useTransition();
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      fullName: lead?.fullName ?? "",
      phone: lead?.phone ?? "",
      email: lead?.email ?? "",
      source: lead?.source ?? "Instagram",
      eventType: lead?.eventType ?? "Boda",
      estimatedDate: lead?.estimatedDate ?? "",
      peopleCount: lead?.peopleCount ?? 80,
      status: lead?.status ?? "Nuevo",
      assignedUserId: lead?.assignedUserId ?? users[0]?.id,
      notes: lead?.notes ?? ""
    }
  });

  const onSubmit = (values: LeadFormValues) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.append(key, String(value ?? "")));
    startTransition(async () => {
      if (lead?.id) {
        await updateLead(lead.id, formData);
      } else {
        await createLead(formData);
        form.reset();
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
      <Field label="Nombre completo"><Input {...form.register("fullName")} placeholder="Nombre del cliente" /></Field>
      <Field label="Teléfono"><Input {...form.register("phone")} placeholder="3001234567" /></Field>
      <Field label="Correo"><Input type="email" {...form.register("email")} placeholder="cliente@email.com" /></Field>
      <Field label="Origen"><Input {...form.register("source")} /></Field>
      <Field label="Tipo de evento"><Input {...form.register("eventType")} /></Field>
      <Field label="Fecha tentativa"><Input type="date" {...form.register("estimatedDate")} /></Field>
      <Field label="Personas"><Input type="number" {...form.register("peopleCount")} /></Field>
      <Field label="Estado"><Input {...form.register("status")} /></Field>
      <Field label="Responsable">
        <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" {...form.register("assignedUserId")}>
          {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
        </select>
      </Field>
      <Field label="Notas" className="md:col-span-2"><Textarea {...form.register("notes")} /></Field>
      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />} {lead?.id ? "Guardar cambios" : "Crear lead"}</Button>
      </div>
    </form>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return <div className={className}><Label>{label}</Label><div className="mt-1.5">{children}</div></div>;
}
