import { PrismaClient, Prisma } from "@prisma/client";
import { addDays, addHours, setHours, setMinutes } from "date-fns";
import { buildCateringRequirement, isCateringQuoteItem } from "../src/lib/catering";
import { defaultEventTimeline, suggestedSupplier } from "../src/lib/event-plan";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

const money = (value: number) => new Prisma.Decimal(value);

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.note.deleteMany();
  await prisma.purchaseTask.deleteMany();
  await prisma.eventScheduleItem.deleteMany();
  await prisma.cateringRequirement.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.serviceItem.deleteMany();
  await prisma.space.deleteMany();
  await prisma.user.deleteMany();
  await prisma.client.deleteMany();
  await prisma.role.deleteMany();
  await prisma.pipelineStage.deleteMany();

  const roles = await Promise.all(
    ["Administrador", "Comercial", "Operativo"].map((name) =>
      prisma.role.create({ data: { name } })
    )
  );

  const [adminRole, salesRole, opsRole] = roles;
  const [hacienda, demoClient] = await Promise.all([
    prisma.client.create({
      data: {
        name: "Hacienda La Julieta",
        slug: "hacienda-la-julieta",
        description: "Cliente de eventos sociales, empresariales y campestres."
      }
    }),
    prisma.client.create({
      data: {
        name: "Qora Demo",
        slug: "qora-demo",
        description: "Espacio demostrativo generico para presentar Qora sin datos de un cliente especifico."
      }
    })
  ]);

  const [admin, sales, ops, demoSales, demoOps] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Admin Provexpress",
        email: "admin@provexpress.co",
        password: hashPassword("demo"),
        roleId: adminRole.id
      }
    }),
    prisma.user.create({
      data: {
        name: "Comercial Hacienda",
        email: "comercial@haciendalajulieta.co",
        password: hashPassword("demo"),
        roleId: salesRole.id,
        clientId: hacienda.id
      }
    }),
    prisma.user.create({
      data: {
        name: "Operativo Hacienda",
        email: "operativo@haciendalajulieta.co",
        password: hashPassword("demo"),
        roleId: opsRole.id,
        clientId: hacienda.id
      }
    }),
    prisma.user.create({
      data: {
        name: "Comercial Demo",
        email: "comercial@qora.demo",
        password: hashPassword("demo"),
        roleId: salesRole.id,
        clientId: demoClient.id
      }
    }),
    prisma.user.create({
      data: {
        name: "Operativo Demo",
        email: "operativo@qora.demo",
        password: hashPassword("demo"),
        roleId: opsRole.id,
        clientId: demoClient.id
      }
    })
  ]);

  const stageData = [
    ["Nuevo lead", 1, "#64748b"],
    ["Contactado", 2, "#2563eb"],
    ["En seguimiento", 3, "#7c3aed"],
    ["Cotización enviada", 4, "#db2777"],
    ["Reserva tentativa", 5, "#ea580c"],
    ["Confirmado", 6, "#16a34a"],
    ["Perdido", 7, "#dc2626"]
  ] as const;

  const stages = await Promise.all(
    stageData.map(([name, order, color]) =>
      prisma.pipelineStage.create({ data: { name, order, color } })
    )
  );

  const services = await prisma.$transaction([
    prisma.serviceItem.create({ data: { clientId: hacienda.id, name: "Alquiler de espacio", category: "Espacios", description: "Uso del espacio seleccionado por jornada", price: money(4200000), cost: money(1450000), active: true } }),
    prisma.serviceItem.create({ data: { clientId: hacienda.id, name: "Decoración base", category: "Decoración", description: "Ambientación base con centros y mesa principal", price: money(1800000), cost: money(950000), active: true } }),
    prisma.serviceItem.create({ data: { clientId: hacienda.id, name: "Flores", category: "Decoración", description: "Arreglos florales naturales", price: money(1250000), cost: money(720000), active: true } }),
    prisma.serviceItem.create({ data: { clientId: hacienda.id, name: "Sonido", category: "Producción", description: "Sistema de sonido profesional con técnico", price: money(1600000), cost: money(900000), active: true } }),
    prisma.serviceItem.create({ data: { clientId: hacienda.id, name: "Alimentación", category: "Catering", description: "Menú por persona para eventos sociales", price: money(95000), cost: money(56000), active: true } }),
    prisma.serviceItem.create({ data: { clientId: hacienda.id, name: "Mobiliario", category: "Logística", description: "Mesas, sillas y mantelería", price: money(22000), cost: money(13000), active: true } }),
    prisma.serviceItem.create({ data: { clientId: hacienda.id, name: "Fotografía", category: "Producción", description: "Cobertura fotográfica del evento", price: money(2100000), cost: money(1250000), active: true } }),
    prisma.serviceItem.create({ data: { clientId: hacienda.id, name: "Personal de apoyo", category: "Logística", description: "Auxiliares y coordinación en sitio", price: money(380000), cost: money(230000), active: true } }),
    prisma.serviceItem.create({ data: { clientId: hacienda.id, name: "Estación de bebidas", category: "Catering", description: "Barra de bebidas sin alcohol", price: money(1350000), cost: money(780000), active: true } }),
    prisma.serviceItem.create({ data: { clientId: hacienda.id, name: "Montaje especial", category: "Logística", description: "Montaje personalizado según concepto", price: money(2700000), cost: money(1550000), active: true } })
  ]);

  const spaces = await prisma.$transaction([
    prisma.space.create({ data: { clientId: hacienda.id, name: "Salón principal", capacity: 220, description: "Salón cubierto para eventos sociales y empresariales", active: true } }),
    prisma.space.create({ data: { clientId: hacienda.id, name: "Zona campestre", capacity: 300, description: "Área abierta para experiencias campestres", active: true } }),
    prisma.space.create({ data: { clientId: hacienda.id, name: "Terraza", capacity: 120, description: "Terraza con vista al jardín", active: true } }),
    prisma.space.create({ data: { clientId: hacienda.id, name: "Jardín exterior", capacity: 180, description: "Jardín para ceremonias y recepciones", active: true } }),
    prisma.space.create({ data: { clientId: hacienda.id, name: "Zona privada", capacity: 60, description: "Espacio íntimo para celebraciones privadas", active: true } })
  ]);

  const leadInputs = [
    { fullName: "Mariana Rojas", phone: "3004567890", email: "mariana.rojas@email.com", source: "Instagram", eventType: "Boda", peopleCount: 160, status: "Activo", stage: 3, value: 28500000, priority: "Alta", title: "Boda Mariana y Andrés" },
    { fullName: "Camilo Torres", phone: "3108842211", email: "camilo.torres@andina.com", source: "Referido", eventType: "Evento empresarial", peopleCount: 90, status: "Activo", stage: 4, value: 18500000, priority: "Media", title: "Encuentro comercial Andina" },
    { fullName: "Laura Méndez", phone: "3156678120", email: "laura.mendez@email.com", source: "Web", eventType: "Cumpleaños", peopleCount: 55, status: "Activo", stage: 2, value: 9200000, priority: "Media", title: "Cumpleaños Laura 40" },
    { fullName: "Santiago Bernal", phone: "3015548820", email: "santiago.bernal@email.com", source: "Llamada", eventType: "Celebración privada", peopleCount: 35, status: "Nuevo", stage: 1, value: 6500000, priority: "Baja", title: "Cena familiar Bernal" },
    { fullName: "Natalia Cárdenas", phone: "3208877712", email: "natalia.cardenas@verde.co", source: "Instagram", eventType: "Evento campestre", peopleCount: 130, status: "Activo", stage: 5, value: 22400000, priority: "Alta", title: "Día campestre Verde SAS" },
    { fullName: "Felipe Ospina", phone: "3124445599", email: "felipe.ospina@email.com", source: "Feria", eventType: "Boda", peopleCount: 210, status: "Activo", stage: 6, value: 36200000, priority: "Alta", title: "Boda Felipe y Ana" }
  ];

  for (const [index, input] of leadInputs.entries()) {
    const lead = await prisma.lead.create({
      data: {
        clientId: hacienda.id,
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        source: input.source,
        eventType: input.eventType,
        estimatedDate: addDays(new Date(), 25 + index * 12),
        peopleCount: input.peopleCount,
        status: input.status,
        notes: "Lead creado para operación comercial de Hacienda La Julieta.",
        assignedUserId: sales.id
      }
    });

    const opportunity = await prisma.opportunity.create({
      data: {
        leadId: lead.id,
        title: input.title,
        stageId: stages[input.stage - 1].id,
        estimatedValue: money(input.value),
        priority: input.priority,
        expectedCloseDate: addDays(new Date(), 7 + index * 4),
        notes: "Oportunidad con seguimiento activo.",
        assignedUserId: index % 2 === 0 ? sales.id : admin.id
      }
    });

    await prisma.activity.create({
      data: {
        opportunityId: opportunity.id,
        userId: sales.id,
        title: index % 2 === 0 ? "Llamada de seguimiento" : "Enviar propuesta ajustada",
        description: "Actividad pendiente para avanzar el negocio.",
        activityDate: addHours(new Date(), 8 + index * 6),
        type: index % 2 === 0 ? "Llamada" : "Correo",
        status: index < 4 ? "Pendiente" : "Finalizada"
      }
    });

    if (index === 1 || index === 4 || index === 5) {
      await prisma.reservation.create({
        data: {
          opportunityId: opportunity.id,
          spaceId: spaces[index % spaces.length].id,
          reservationDate: setMinutes(setHours(addDays(new Date(), 20 + index * 9), 15), 0),
          startTime: "15:00",
          endTime: "23:00",
          status: index === 5 ? "Confirmada" : "Pendiente",
          notes: "Bloqueo tentativo sujeto a aceptación de cotización."
        }
      });
    }

    if (index === 0 || index === 1 || index === 4 || index === 5) {
      const selected = input.eventType === "Boda" ? [services[0], services[1], services[2], services[3], services[4], services[6]] : [services[0], services[3], services[4], services[5], services[7]];
      const subtotal = selected.reduce((sum, item) => sum + Number(item.price) * (item.category === "Catering" || item.name === "Mobiliario" ? input.peopleCount : 1), 0);
      const costSubtotal = selected.reduce((sum, item) => sum + Number(item.cost) * (item.category === "Catering" || item.name === "Mobiliario" ? input.peopleCount : 1), 0);
      const discount = index === 5 ? 800000 : 0;
      const total = subtotal - discount;
      const profit = total - costSubtotal;
      const quote = await prisma.quote.create({
        data: {
          opportunityId: opportunity.id,
          quoteNumber: `HJ-${String(index + 1).padStart(4, "0")}`,
          title: `Cotización ${input.eventType}`,
          status: index === 5 ? "Aceptada" : index === 4 ? "Enviada" : "Borrador",
          subtotal: money(subtotal),
          costSubtotal: money(costSubtotal),
          discount: money(discount),
          total: money(total),
          profit: money(profit),
          marginPercent: money(total > 0 ? (profit / total) * 100 : 0),
          validUntil: addDays(new Date(), 15),
          notes: "Cotización generada desde plantilla sugerida."
        }
      });

      await prisma.quoteItem.createMany({
        data: selected.map((item) => {
          const quantity = item.category === "Catering" || item.name === "Mobiliario" ? input.peopleCount : 1;
          return {
            quoteId: quote.id,
            serviceItemId: item.id,
            description: item.name,
            quantity,
            unitPrice: item.price,
            unitCost: item.cost,
            total: money(Number(item.price) * quantity),
            totalCost: money(Number(item.cost) * quantity)
          };
        })
      });

      if (index === 5) {
        await prisma.opportunity.update({
          where: { id: opportunity.id },
          data: {
            operationCode: "OP-2026-0001",
            operationalStatus: "Alistamiento en curso",
            wonAt: new Date(),
            assignedUserId: ops.id
          }
        });
        await prisma.lead.update({
          where: { id: lead.id },
          data: { status: "En operacion" }
        });
      }
    }
  }

  const demoServices = await prisma.$transaction([
    prisma.serviceItem.create({ data: { clientId: demoClient.id, name: "Diagnostico comercial", category: "Consultoria", description: "Levantamiento de proceso, roles y embudo actual.", price: money(2800000), cost: money(1100000), active: true } }),
    prisma.serviceItem.create({ data: { clientId: demoClient.id, name: "Implementacion CRM", category: "Proyecto", description: "Configuracion del flujo comercial, pipeline, agenda y cotizaciones.", price: money(9200000), cost: money(4300000), active: true } }),
    prisma.serviceItem.create({ data: { clientId: demoClient.id, name: "Automatizacion de seguimiento", category: "Automatizacion", description: "Tareas, recordatorios y control de oportunidades frias.", price: money(3600000), cost: money(1450000), active: true } }),
    prisma.serviceItem.create({ data: { clientId: demoClient.id, name: "Capacitacion por rol", category: "Adopcion", description: "Sesion comercial, operativa y administrativa.", price: money(1800000), cost: money(700000), active: true } }),
    prisma.serviceItem.create({ data: { clientId: demoClient.id, name: "Soporte mensual", category: "Soporte", description: "Acompanamiento funcional y mejoras menores.", price: money(1200000), cost: money(520000), active: true } }),
    prisma.serviceItem.create({ data: { clientId: demoClient.id, name: "Reporte gerencial avanzado", category: "Reportes", description: "Tablero de conversion, ventas, utilidad y salud del CRM.", price: money(2400000), cost: money(950000), active: true } })
  ]);

  const demoSpaces = await prisma.$transaction([
    prisma.space.create({ data: { clientId: demoClient.id, name: "Sesion remota", capacity: 20, description: "Espacio virtual para reuniones de descubrimiento y capacitacion.", active: true } }),
    prisma.space.create({ data: { clientId: demoClient.id, name: "Sala ejecutiva", capacity: 12, description: "Agenda presencial con equipo directivo.", active: true } }),
    prisma.space.create({ data: { clientId: demoClient.id, name: "Comite comercial", capacity: 25, description: "Reunion de seguimiento con equipo comercial.", active: true } })
  ]);

  const demoLeadInputs = [
    { fullName: "Andres Vargas", phone: "3001002030", email: "andres.vargas@nova.co", source: "LinkedIn", eventType: "Implementacion CRM", peopleCount: 12, status: "Activo", stage: 1, value: 12800000, priority: "Alta", title: "CRM para Nova Retail", quoteStatus: null },
    { fullName: "Diana Pardo", phone: "3107788990", email: "diana.pardo@orbita.co", source: "Referido", eventType: "Automatizacion comercial", peopleCount: 8, status: "Activo", stage: 2, value: 7600000, priority: "Media", title: "Automatizacion de seguimiento Orbita", quoteStatus: "Borrador" },
    { fullName: "Luis Moreno", phone: "3159091122", email: "luis.moreno@andescorp.co", source: "Web", eventType: "Reporte gerencial", peopleCount: 6, status: "Activo", stage: 4, value: 10400000, priority: "Media", title: "Tablero ejecutivo Andes Corp", quoteStatus: "Enviada" },
    { fullName: "Paula Rincon", phone: "3204048899", email: "paula.rincon@vector.co", source: "Evento", eventType: "Capacitacion y adopcion", peopleCount: 18, status: "Activo", stage: 5, value: 6200000, priority: "Baja", title: "Adopcion CRM Vector", quoteStatus: "Enviada" },
    { fullName: "Carolina Mejia", phone: "3012223344", email: "carolina.mejia@cobalto.co", source: "Demo", eventType: "Proyecto CRM completo", peopleCount: 15, status: "En operacion", stage: 6, value: 18200000, priority: "Alta", title: "Qora CRM Cobalto", quoteStatus: "Aceptada" }
  ] as const;

  for (const [index, input] of demoLeadInputs.entries()) {
    const lead = await prisma.lead.create({
      data: {
        clientId: demoClient.id,
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        source: input.source,
        eventType: input.eventType,
        estimatedDate: addDays(new Date(), 18 + index * 8),
        peopleCount: input.peopleCount,
        status: input.status,
        notes: "Registro generico para mostrar un CRM comercial sin depender de un cliente especifico.",
        assignedUserId: demoSales.id
      }
    });

    const opportunity = await prisma.opportunity.create({
      data: {
        leadId: lead.id,
        title: input.title,
        stageId: stages[input.stage - 1].id,
        estimatedValue: money(input.value),
        priority: input.priority,
        expectedCloseDate: addDays(new Date(), 5 + index * 3),
        operationCode: input.quoteStatus === "Aceptada" ? "OP-2026-0002" : null,
        operationalStatus: input.quoteStatus === "Aceptada" ? "Alistamiento en curso" : null,
        wonAt: input.quoteStatus === "Aceptada" ? new Date() : null,
        notes: "Oportunidad demostrativa con seguimiento, cotizacion y agenda.",
        assignedUserId: input.quoteStatus === "Aceptada" ? demoOps.id : demoSales.id
      }
    });

    await prisma.activity.create({
      data: {
        opportunityId: opportunity.id,
        userId: input.quoteStatus === "Aceptada" ? demoOps.id : demoSales.id,
        title: input.quoteStatus === "Aceptada" ? "Kickoff operativo" : index % 2 === 0 ? "Llamada de descubrimiento" : "Seguimiento comercial",
        description: "Actividad demostrativa para mostrar agenda, responsables y trazabilidad.",
        activityDate: addDays(new Date(), index + 1),
        type: input.quoteStatus === "Aceptada" ? "OperaciÃ³n" : "Seguimiento",
        status: index === 0 ? "Pendiente" : "Finalizada"
      }
    });

    if (index >= 2) {
      await prisma.reservation.create({
        data: {
          opportunityId: opportunity.id,
          spaceId: demoSpaces[index % demoSpaces.length].id,
          reservationDate: addDays(new Date(), 16 + index * 7),
          startTime: index === 4 ? "08:30" : "10:00",
          endTime: index === 4 ? "12:30" : "11:30",
          status: input.quoteStatus === "Aceptada" ? "Confirmada" : "Pendiente",
          notes: "Agenda demostrativa para validar disponibilidad, reunion o entrega."
        }
      });
    }

    if (input.quoteStatus) {
      const selected = index === 1
        ? [demoServices[0], demoServices[2]]
        : index === 2
          ? [demoServices[0], demoServices[5], demoServices[3]]
          : index === 3
            ? [demoServices[3], demoServices[4]]
            : [demoServices[0], demoServices[1], demoServices[2], demoServices[3], demoServices[5]];
      const subtotal = selected.reduce((sum, item) => sum + Number(item.price), 0);
      const costSubtotal = selected.reduce((sum, item) => sum + Number(item.cost), 0);
      const discount = input.quoteStatus === "Aceptada" ? 900000 : 0;
      const total = subtotal - discount;
      const profit = total - costSubtotal;

      await prisma.quote.create({
        data: {
          opportunityId: opportunity.id,
          quoteNumber: `QD-${String(index).padStart(4, "0")}`,
          title: `Propuesta ${input.eventType}`,
          status: input.quoteStatus,
          subtotal: money(subtotal),
          costSubtotal: money(costSubtotal),
          discount: money(discount),
          total: money(total),
          profit: money(profit),
          marginPercent: money(total > 0 ? (profit / total) * 100 : 0),
          validUntil: addDays(new Date(), 15),
          notes: "Propuesta generica para presentar el flujo CRM de Qora.",
          items: {
            create: selected.map((item) => ({
              serviceItemId: item.id,
              description: item.name,
              quantity: 1,
              unitPrice: item.price,
              unitCost: item.cost,
              total: item.price,
              totalCost: item.cost
            }))
          }
        }
      });
    }
  }

  await prisma.activity.create({
    data: {
      opportunityId: (await prisma.opportunity.findFirstOrThrow({ where: { lead: { clientId: hacienda.id } } })).id,
      userId: ops.id,
      title: "Validar disponibilidad operativa",
      description: "Confirmar equipo y montaje sugerido.",
      activityDate: addDays(new Date(), 2),
      type: "Tarea",
      status: "Pendiente"
    }
  });

  const acceptedQuotes = await prisma.quote.findMany({
    where: { status: "Aceptada" },
    include: {
      items: { include: { serviceItem: true } },
      opportunity: {
        include: {
          reservations: { orderBy: { reservationDate: "asc" }, take: 1 },
          purchaseTasks: true,
          scheduleItems: true
        }
      }
    }
  });

  for (const quote of acceptedQuotes) {
    const reservation = quote.opportunity.reservations[0];
    const foodItems = quote.items.filter(isCateringQuoteItem);

    if (foodItems.length > 0) {
      await prisma.cateringRequirement.createMany({
        data: foodItems.map((item) => ({
          opportunityId: quote.opportunityId,
          ...buildCateringRequirement(item, reservation?.startTime)
        }))
      });
    }

    if (quote.opportunity.purchaseTasks.length === 0) {
      await prisma.purchaseTask.createMany({
        data: quote.items.map((item) => ({
          opportunityId: quote.opportunityId,
          quoteItemId: item.id,
          description: item.description,
          category: item.serviceItem?.category ?? "Servicio",
          quantity: item.quantity,
          estimatedCost: item.totalCost,
          supplier: suggestedSupplier(item.serviceItem?.category ?? item.description),
          status: "Pendiente",
          dueDate: reservation?.reservationDate ? addDays(reservation.reservationDate, -5) : quote.validUntil,
          notes: `Compra o contratacion derivada de ${quote.quoteNumber}.`
        }))
      });
    }

    if (quote.opportunity.scheduleItems.length === 0) {
      const scheduleDate = reservation?.reservationDate ?? quote.validUntil;

      await prisma.eventScheduleItem.createMany({
        data: defaultEventTimeline.map((item, index) => ({
          opportunityId: quote.opportunityId,
          scheduleDate,
          title: item.title,
          description: "Bloque sugerido para coordinar la ejecucion del negocio ganado.",
          startTime: index === 3 && reservation ? reservation.startTime : item.startTime,
          endTime: index === 6 && reservation ? reservation.endTime : item.endTime,
          type: item.type,
          owner: item.owner,
          status: "Pendiente",
          order: index + 1
        }))
      });
    }
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

