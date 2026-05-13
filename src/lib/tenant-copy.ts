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

export type TenantVocabulary = {
  isEventTenant: boolean;
  subjectSingular: string;
  subjectPlural: string;
  needLabel: string;
  quantityLabel: string;
  dateLabel: string;
  reservationLabel: string;
  reservationPlural: string;
  locationLabel: string;
  postSaleLabel: string;
  postSalePlural: string;
  preparationLabel: string;
  operationAction: string;
  dashboardTitle: string;
  dashboardMetric: string;
  pipelineDescription: string;
  leadsDescription: string;
  quoteDescription: string;
  reportReservationKpi: string;
  reportTypeTitle: string;
};

const eventVocabulary: TenantVocabulary = {
  isEventTenant: true,
  subjectSingular: "evento",
  subjectPlural: "eventos",
  needLabel: "Tipo de evento",
  quantityLabel: "Personas",
  dateLabel: "Fecha tentativa",
  reservationLabel: "reserva",
  reservationPlural: "reservas",
  locationLabel: "Espacio",
  postSaleLabel: "Operacion",
  postSalePlural: "Eventos operativos",
  preparationLabel: "Alistamiento",
  operationAction: "Aceptar y operar",
  dashboardTitle: "De lead a evento operado, con trazabilidad comercial, financiera y logistica.",
  dashboardMetric: "Eventos en operacion",
  pipelineDescription: "Cada tarjeta conserva contexto del cliente, evento, responsable, prioridad y valor estimado para facilitar una gestion comercial fluida.",
  leadsDescription: "Concentra informacion inicial del cliente, origen, tipo de evento, responsable y el salto natural hacia el pipeline comercial.",
  quoteDescription: "El comercial puede crear la propuesta, enviarla, abrir el PDF, aceptar el negocio y disparar automaticamente operacion y alistamiento.",
  reportReservationKpi: "Reservas confirmadas",
  reportTypeTitle: "Tipo de evento"
};

const crmVocabulary: TenantVocabulary = {
  isEventTenant: false,
  subjectSingular: "proyecto",
  subjectPlural: "proyectos",
  needLabel: "Necesidad",
  quantityLabel: "Alcance",
  dateLabel: "Fecha estimada",
  reservationLabel: "agenda",
  reservationPlural: "agendas",
  locationLabel: "Modalidad",
  postSaleLabel: "Postventa",
  postSalePlural: "Proyectos ganados",
  preparationLabel: "Implementacion",
  operationAction: "Marcar ganada",
  dashboardTitle: "De lead a negocio ganado, con trazabilidad comercial, financiera y de postventa.",
  dashboardMetric: "Negocios ganados",
  pipelineDescription: "Cada tarjeta conserva contexto del cliente, necesidad, responsable, prioridad y valor estimado para facilitar una gestion comercial fluida.",
  leadsDescription: "Concentra informacion inicial del cliente, origen, necesidad, responsable y el salto natural hacia el pipeline comercial.",
  quoteDescription: "El comercial puede crear la propuesta, enviarla, abrir el PDF y marcarla como ganada para activar el seguimiento postventa.",
  reportReservationKpi: "Agendas confirmadas",
  reportTypeTitle: "Tipo de necesidad"
};

export function vocabularyForTenant(clientSlug?: string | null): TenantVocabulary {
  return clientSlug === "hacienda-la-julieta" ? eventVocabulary : crmVocabulary;
}
