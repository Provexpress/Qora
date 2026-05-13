export const defaultEventTimeline = [
  { title: "Ingreso de proveedores", startTime: "09:00", endTime: "10:00", type: "Alistamiento", owner: "Operación" },
  { title: "Montaje de mobiliario y decoración", startTime: "10:00", endTime: "13:00", type: "Alistamiento", owner: "Operación" },
  { title: "Pruebas de sonido, iluminación y montaje", startTime: "13:00", endTime: "14:00", type: "Validación", owner: "Operación" },
  { title: "Recepción de invitados", startTime: "15:00", endTime: "16:00", type: "Evento", owner: "Anfitrión" },
  { title: "Inicio formal del evento", startTime: "16:00", endTime: "18:00", type: "Evento", owner: "Coordinación" },
  { title: "Servicio principal y apoyo en sitio", startTime: "18:00", endTime: "21:00", type: "Evento", owner: "Operación" },
  { title: "Cierre del evento", startTime: "21:00", endTime: "23:00", type: "Cierre", owner: "Operación" },
  { title: "Desmontaje y entrega de espacio", startTime: "23:00", endTime: "23:59", type: "Cierre", owner: "Operación" }
];

export function suggestedSupplier(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("catering") || normalized.includes("aliment")) return "Proveedor catering";
  if (normalized.includes("decor") || normalized.includes("flores")) return "Proveedor decoración";
  if (normalized.includes("sonido") || normalized.includes("producción")) return "Proveedor producción";
  if (normalized.includes("mobiliario") || normalized.includes("logística")) return "Proveedor logística";
  return "Proveedor por definir";
}
