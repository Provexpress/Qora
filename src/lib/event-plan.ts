export const defaultEventTimeline = [
  { title: "Kickoff del proyecto", startTime: "09:00", endTime: "10:00", type: "Inicio", owner: "Comercial" },
  { title: "Revision de alcance vendido", startTime: "10:00", endTime: "11:00", type: "Validacion", owner: "Postventa" },
  { title: "Configuracion o activacion inicial", startTime: "11:00", endTime: "13:00", type: "Implementacion", owner: "Operaciones" },
  { title: "Seguimiento con usuario lider", startTime: "14:00", endTime: "15:00", type: "Seguimiento", owner: "Consultor" },
  { title: "Ajustes y control de pendientes", startTime: "15:00", endTime: "16:00", type: "Implementacion", owner: "Operaciones" },
  { title: "Validacion de entrega", startTime: "16:00", endTime: "17:00", type: "Validacion", owner: "Cliente" },
  { title: "Cierre de implementacion", startTime: "17:00", endTime: "18:00", type: "Cierre", owner: "Postventa" }
];

export function suggestedSupplier(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("consult")) return "Equipo consultoria";
  if (normalized.includes("automat")) return "Equipo automatizacion";
  if (normalized.includes("reporte")) return "Equipo analitica";
  if (normalized.includes("soporte")) return "Mesa de ayuda";
  return "Proveedor por definir";
}
