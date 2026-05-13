export type QuotePresentationCopy = {
  subtitle: string;
  intro: (category: string) => string;
  contextTitle: string;
  peopleLabel: (count: number) => string;
  operationTitle: string;
  operationLines: {
    locationFallback: string;
    scheduleFallback: string;
  };
  footer: string;
};

const defaultQuoteCopy: QuotePresentationCopy = {
  subtitle: "Propuesta comercial para cliente - Provexpress",
  intro: (category) => `Propuesta para ${category.toLowerCase()} con alcance, servicios seleccionados, agenda tentativa y condiciones comerciales.`,
  contextTitle: "Proyecto",
  peopleLabel: (count) => `${count} usuarios / asistentes`,
  operationTitle: "Ejecucion tentativa",
  operationLines: {
    locationFallback: "Modalidad por confirmar",
    scheduleFallback: "Horario por confirmar"
  },
  footer: "Esta cotizacion es una propuesta comercial formal para el cliente. Los valores estan sujetos a disponibilidad, alcance final y condiciones acordadas."
};

const haciendaQuoteCopy: QuotePresentationCopy = {
  subtitle: "Propuesta comercial para evento - Provexpress",
  intro: (category) => `Propuesta para ${category.toLowerCase()} con servicios seleccionados, disponibilidad tentativa del espacio y condiciones comerciales.`,
  contextTitle: "Evento",
  peopleLabel: (count) => `${count} personas`,
  operationTitle: "Operacion tentativa",
  operationLines: {
    locationFallback: "Espacio por confirmar",
    scheduleFallback: "Horario por confirmar"
  },
  footer: "Esta cotizacion corresponde a una propuesta comercial de evento. Los valores estan sujetos a disponibilidad del espacio, alcance final y condiciones acordadas."
};

export function quotePresentationForTenant(clientSlug?: string | null): QuotePresentationCopy {
  if (clientSlug === "hacienda-la-julieta") {
    return haciendaQuoteCopy;
  }

  return defaultQuoteCopy;
}
