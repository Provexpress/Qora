"use client";

import { useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { FilePlus2, Loader2, Plus, Trash2 } from "lucide-react";
import { createQuote } from "@/actions/quotes";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type OpportunityOption = { id: string; title: string; lead: { fullName: string; eventType: string } };
type ServiceOption = { id: string; name: string; category: string; price: number; cost: number };
type QuoteItemState = { serviceItemId?: string; description: string; quantity: number; unitPrice: number; unitCost: number };

const templates: Record<string, string[]> = {
  Boda: ["Alquiler de espacio", "Decoración base", "Flores", "Sonido", "Alimentación", "Fotografía"],
  "Evento empresarial": ["Alquiler de espacio", "Sonido", "Alimentación", "Mobiliario", "Personal de apoyo"],
  Cumpleaños: ["Alquiler de espacio", "Decoración base", "Alimentación", "Estación de bebidas"],
  "Celebración privada": ["Zona privada", "Alimentación", "Mobiliario", "Personal de apoyo"],
  "Evento campestre": ["Alquiler de espacio", "Montaje especial", "Alimentación", "Estación de bebidas", "Personal de apoyo"]
};

export function QuoteForm({
  opportunities,
  services,
  canManageCosts
}: {
  opportunities: OpportunityOption[];
  services: ServiceOption[];
  canManageCosts: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [opportunityId, setOpportunityId] = useState(opportunities[0]?.id ?? "");
  const [title, setTitle] = useState("Cotización comercial");
  const [status, setStatus] = useState("Borrador");
  const [discount, setDiscount] = useState(0);
  const [targetMargin, setTargetMargin] = useState(35);
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<QuoteItemState[]>([]);
  const selectedOpportunity = opportunities.find((item) => item.id === opportunityId);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [items]);
  const costSubtotal = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0), [items]);
  const total = Math.max(subtotal - discount, 0);
  const profit = total - costSubtotal;
  const margin = total > 0 ? (profit / total) * 100 : 0;
  const discountTooHigh = discount > subtotal;
  const customItemMissingCost = items.some((item) => !item.serviceItemId && item.unitCost <= 0);
  const canSave = !pending && Boolean(validUntil) && items.length > 0 && !discountTooHigh && !customItemMissingCost;

  const addService = (service: ServiceOption) => {
    setItems((current) => [
      ...current,
      {
        serviceItemId: service.id,
        description: service.name,
        quantity: service.category === "Catering" ? 80 : 1,
        unitPrice: service.price,
        unitCost: service.cost
      }
    ]);
  };

  const applyTemplate = (name: string) => {
    const names = templates[name] ?? [];
    const next = services
      .filter((service) => names.includes(service.name))
      .map((service) => ({
        serviceItemId: service.id,
        description: service.name,
        quantity: service.category === "Catering" || service.name === "Mobiliario" ? 80 : 1,
        unitPrice: service.price,
        unitCost: service.cost
      }));
    setTitle(`Cotización ${name}`);
    setItems(next);
  };

  const submit = () => {
    startTransition(async () => {
      const quote = await createQuote({ opportunityId, title, status, discount, validUntil, notes, items });
      setOpen(false);
      if (quote?.id) {
        window.open(`/cotizaciones/${quote.id}/pdf`, "_blank", "noopener,noreferrer");
      }
    });
  };

  const addCustomItem = () => {
    setItems((current) => [...current, { description: "Ítem personalizado", quantity: 1, unitPrice: 0, unitCost: 0 }]);
  };

  const applyTargetMargin = () => {
    setItems((current) =>
      current.map((item) => ({
        ...item,
        unitPrice: item.unitCost > 0 ? priceFromMargin(item.unitCost, targetMargin) : item.unitPrice
      }))
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><FilePlus2 className="h-4 w-4" /> Nueva cotización</Button></DialogTrigger>
      <DialogContent className="w-[min(96vw,1080px)]">
        <DialogHeader><DialogTitle>Crear cotización</DialogTitle></DialogHeader>
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Oportunidad">
                <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={opportunityId} onChange={(event) => setOpportunityId(event.target.value)}>
                  {opportunities.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.lead.fullName}</option>)}
                </select>
              </Field>
              <Field label="Plantilla">
                <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" onChange={(event) => event.target.value && applyTemplate(event.target.value)} defaultValue="">
                  <option value="">Seleccionar plantilla</option>
                  {Object.keys(templates).map((name) => <option key={name}>{name}</option>)}
                </select>
              </Field>
              <Field label="Título"><Input value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
              <Field label="Estado">
                <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option>Borrador</option>
                  <option>Enviada</option>
                </select>
              </Field>
              <Field label="Válida hasta"><Input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} /></Field>
              <Field label="Descuento"><Input type="number" value={discount} onChange={(event) => setDiscount(Number(event.target.value))} /></Field>
              <Field label="Margen objetivo">
                <div className="flex gap-2">
                  <Input type="number" min={0} max={90} value={targetMargin} onChange={(event) => setTargetMargin(Number(event.target.value))} />
                  <Button type="button" variant="outline" onClick={applyTargetMargin}>Aplicar</Button>
                </div>
              </Field>
            </div>
            <div className="rounded-lg border">
              <div className="grid grid-cols-[1fr_70px_104px_104px_82px_42px] gap-2 border-b bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                <span>Ítem</span><span>Cant.</span><span>Venta</span><span>Costo</span><span>Margen</span><span />
              </div>
              <div className="divide-y">
                {items.map((item, index) => {
                  const itemTotal = item.quantity * item.unitPrice;
                  const itemCost = item.quantity * item.unitCost;
                  const itemMargin = itemTotal > 0 ? ((itemTotal - itemCost) / itemTotal) * 100 : 0;
                  const canEditCost = canManageCosts || !item.serviceItemId;

                  return (
                    <motion.div layout key={`${item.description}-${index}`} className="grid grid-cols-[1fr_70px_104px_104px_82px_42px] gap-2 p-3">
                      <Input value={item.description} onChange={(event) => setItems((current) => current.map((row, idx) => idx === index ? { ...row, description: event.target.value } : row))} />
                      <Input type="number" value={item.quantity} onChange={(event) => setItems((current) => current.map((row, idx) => idx === index ? { ...row, quantity: Number(event.target.value) } : row))} />
                      <Input type="number" value={item.unitPrice} onChange={(event) => setItems((current) => current.map((row, idx) => idx === index ? { ...row, unitPrice: Number(event.target.value) } : row))} />
                      <Input
                        type="number"
                        value={item.unitCost}
                        disabled={!canEditCost}
                        title={canEditCost ? "Costo estimado para calcular utilidad" : "Costo base bloqueado desde Catálogo"}
                        onChange={(event) => setItems((current) => current.map((row, idx) => idx === index ? { ...row, unitCost: Number(event.target.value) } : row))}
                      />
                      <span className={`flex h-10 items-center justify-end rounded-md border px-2 text-xs font-semibold ${marginTone(itemMargin)}`}>{itemMargin.toFixed(1)}%</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => setItems((current) => current.filter((_, idx) => idx !== index))}><Trash2 className="h-4 w-4" /></Button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" onClick={addCustomItem}><Plus className="h-4 w-4" /> Ítem personalizado</Button>
              <p className="text-xs text-muted-foreground">
                Margen objetivo recalcula venta desde costo. La margen real siempre queda calculada por el sistema.
              </p>
            </div>
            <Field label="Notas"><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
          </div>
          <aside className="space-y-4">
            <div className="rounded-lg border bg-slate-50 p-4">
              <p className="text-sm font-semibold">Servicios activos</p>
              <div className="mt-3 max-h-72 space-y-2 overflow-auto pr-1 scrollbar-thin">
                {services.map((service) => (
                  <button key={service.id} type="button" onClick={() => addService(service)} className="w-full rounded-md border bg-white p-3 text-left text-sm hover:border-primary">
                    <span className="font-medium">{service.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{service.category} · venta {formatCurrency(service.price)}</span>
                    {canManageCosts && <span className="mt-1 block text-xs text-muted-foreground">costo {formatCurrency(service.cost)}</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm text-muted-foreground">{selectedOpportunity?.lead.eventType ?? "Cotización"}</p>
              <div className="mt-3 space-y-2 text-sm">
                <p className="flex justify-between"><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></p>
                <p className="flex justify-between"><span>Costo</span><strong>{formatCurrency(costSubtotal)}</strong></p>
                <p className="flex justify-between"><span>Descuento</span><strong>{formatCurrency(discount)}</strong></p>
                <p className="flex justify-between border-t pt-2"><span>Utilidad</span><strong>{formatCurrency(profit)}</strong></p>
                <p className="flex justify-between"><span>Margen</span><strong className={marginTextTone(margin)}>{margin.toFixed(1)}%</strong></p>
                <p className="flex justify-between border-t pt-2 text-base"><span>Total</span><strong>{formatCurrency(total)}</strong></p>
              </div>
              <p className="mt-3 rounded-md bg-slate-50 p-3 text-xs leading-5 text-muted-foreground">
                El comercial puede definir margen objetivo para sugerir precios. Margen real = utilidad / total neto.
              </p>
              {discountTooHigh && <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">El descuento no puede superar el subtotal.</p>}
              {customItemMissingCost && <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">Todo ítem personalizado debe tener costo estimado mayor a cero.</p>}
              <Button className="mt-4 w-full" onClick={submit} disabled={!canSave}>{pending && <Loader2 className="h-4 w-4 animate-spin" />} Guardar y abrir PDF</Button>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><Label>{label}</Label><div className="mt-1.5">{children}</div></div>;
}

function marginTone(value: number) {
  if (value < 0) return "border-rose-200 bg-rose-50 text-rose-700";
  if (value < 25) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function marginTextTone(value: number) {
  if (value < 0) return "text-rose-700";
  if (value < 25) return "text-amber-700";
  return "text-emerald-700";
}

function priceFromMargin(cost: number, margin: number) {
  const normalizedMargin = Math.min(Math.max(margin, 0), 90) / 100;
  return Math.round(cost / (1 - normalizedMargin));
}
