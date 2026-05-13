import { Prisma, PrismaClient } from "@prisma/client";
import { addDays, addHours, setHours, setMinutes } from "date-fns";
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

  const [adminRole, salesRole, opsRole] = await Promise.all(
    ["Administrador", "Comercial", "Operativo"].map((name) => prisma.role.create({ data: { name } }))
  );

  const demoClient = await prisma.client.create({
    data: {
      name: "Qora Demo",
      slug: "qora-demo",
      description: "Espacio demostrativo generico para presentar un CRM comercial sin datos de un cliente especifico."
    }
  });

  const [admin, sales, ops] = await Promise.all([
    prisma.user.create({
      data: { name: "Admin Provexpress", email: "admin@provexpress.co", password: hashPassword("demo"), roleId: adminRole.id }
    }),
    prisma.user.create({
      data: { name: "Comercial Demo", email: "comercial@qora.demo", password: hashPassword("demo"), roleId: salesRole.id, clientId: demoClient.id }
    }),
    prisma.user.create({
      data: { name: "Operativo Demo", email: "operativo@qora.demo", password: hashPassword("demo"), roleId: opsRole.id, clientId: demoClient.id }
    })
  ]);

  const stages = await Promise.all(
    [
      ["Nuevo lead", 1, "#64748b"],
      ["Contactado", 2, "#2563eb"],
      ["Diagnostico", 3, "#7c3aed"],
      ["Propuesta enviada", 4, "#db2777"],
      ["Negociacion", 5, "#ea580c"],
      ["Ganado", 6, "#16a34a"],
      ["Perdido", 7, "#dc2626"]
    ].map(([name, order, color]) => prisma.pipelineStage.create({ data: { name: String(name), order: Number(order), color: String(color) } }))
  );

  const services = await prisma.$transaction([
    prisma.serviceItem.create({ data: { clientId: demoClient.id, name: "Diagnostico comercial", category: "Consultoria", description: "Levantamiento de proceso, roles, canales y embudo actual.", price: money(2800000), cost: money(1100000), active: true } }),
    prisma.serviceItem.create({ data: { clientId: demoClient.id, name: "Implementacion CRM", category: "Proyecto", description: "Configuracion de pipeline, agenda, cotizaciones y tableros.", price: money(9200000), cost: money(4300000), active: true } }),
    prisma.serviceItem.create({ data: { clientId: demoClient.id, name: "Automatizacion de seguimiento", category: "Automatizacion", description: "Tareas, recordatorios y control de oportunidades frias.", price: money(3600000), cost: money(1450000), active: true } }),
    prisma.serviceItem.create({ data: { clientId: demoClient.id, name: "Capacitacion por rol", category: "Adopcion", description: "Sesion comercial, operativa y administrativa.", price: money(1800000), cost: money(700000), active: true } }),
    prisma.serviceItem.create({ data: { clientId: demoClient.id, name: "Soporte mensual", category: "Soporte", description: "Acompanamiento funcional y mejoras menores.", price: money(1200000), cost: money(520000), active: true } }),
    prisma.serviceItem.create({ data: { clientId: demoClient.id, name: "Reporte gerencial avanzado", category: "Reportes", description: "Tablero de conversion, ventas, utilidad y salud del CRM.", price: money(2400000), cost: money(950000), active: true } })
  ]);

  const spaces = await prisma.$transaction([
    prisma.space.create({ data: { clientId: demoClient.id, name: "Sesion remota", capacity: 20, description: "Reunion virtual de descubrimiento, demo o seguimiento.", active: true } }),
    prisma.space.create({ data: { clientId: demoClient.id, name: "Sala ejecutiva", capacity: 12, description: "Agenda presencial con equipo directivo.", active: true } }),
    prisma.space.create({ data: { clientId: demoClient.id, name: "Comite comercial", capacity: 25, description: "Sesion de seguimiento con equipo comercial.", active: true } })
  ]);

  const leadInputs = [
    { fullName: "Andres Vargas", phone: "3001002030", email: "andres.vargas@nova.co", source: "LinkedIn", need: "Implementacion CRM", scope: 12, status: "Activo", stage: 1, value: 12800000, priority: "Alta", title: "CRM para Nova Retail", quoteStatus: null },
    { fullName: "Diana Pardo", phone: "3107788990", email: "diana.pardo@orbita.co", source: "Referido", need: "Automatizacion comercial", scope: 8, status: "Activo", stage: 2, value: 7600000, priority: "Media", title: "Automatizacion de seguimiento Orbita", quoteStatus: "Borrador" },
    { fullName: "Luis Moreno", phone: "3159091122", email: "luis.moreno@andescorp.co", source: "Web", need: "Reporte gerencial", scope: 6, status: "Activo", stage: 4, value: 10400000, priority: "Media", title: "Tablero ejecutivo Andes Corp", quoteStatus: "Enviada" },
    { fullName: "Paula Rincon", phone: "3204048899", email: "paula.rincon@vector.co", source: "Evento comercial", need: "Capacitacion y adopcion", scope: 18, status: "Activo", stage: 5, value: 6200000, priority: "Baja", title: "Adopcion CRM Vector", quoteStatus: "Enviada" },
    { fullName: "Carolina Mejia", phone: "3012223344", email: "carolina.mejia@cobalto.co", source: "Demo", need: "Proyecto CRM completo", scope: 15, status: "En operacion", stage: 6, value: 18200000, priority: "Alta", title: "Qora CRM Cobalto", quoteStatus: "Aceptada" }
  ] as const;

  for (const [index, input] of leadInputs.entries()) {
    const lead = await prisma.lead.create({
      data: {
        clientId: demoClient.id,
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        source: input.source,
        eventType: input.need,
        estimatedDate: addDays(new Date(), 18 + index * 8),
        peopleCount: input.scope,
        status: input.status,
        notes: "Registro generico para mostrar un CRM comercial sin depender de un cliente especifico.",
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
        expectedCloseDate: addDays(new Date(), 5 + index * 3),
        operationCode: input.quoteStatus === "Aceptada" ? "QD-OPS-0001" : null,
        operationalStatus: input.quoteStatus === "Aceptada" ? "Implementacion en curso" : null,
        wonAt: input.quoteStatus === "Aceptada" ? new Date() : null,
        notes: "Oportunidad demostrativa con seguimiento, cotizacion y agenda.",
        assignedUserId: input.quoteStatus === "Aceptada" ? ops.id : sales.id
      }
    });

    await prisma.activity.create({
      data: {
        opportunityId: opportunity.id,
        userId: input.quoteStatus === "Aceptada" ? ops.id : sales.id,
        title: input.quoteStatus === "Aceptada" ? "Kickoff de implementacion" : index % 2 === 0 ? "Llamada de descubrimiento" : "Seguimiento comercial",
        description: "Actividad demostrativa para mostrar agenda, responsables y trazabilidad.",
        activityDate: addHours(new Date(), 8 + index * 10),
        type: input.quoteStatus === "Aceptada" ? "Operacion" : "Seguimiento",
        status: index === 0 ? "Pendiente" : "Finalizada"
      }
    });

    if (index >= 2) {
      await prisma.reservation.create({
        data: {
          opportunityId: opportunity.id,
          spaceId: spaces[index % spaces.length].id,
          reservationDate: setMinutes(setHours(addDays(new Date(), 16 + index * 7), index === 4 ? 8 : 10), 30),
          startTime: index === 4 ? "08:30" : "10:00",
          endTime: index === 4 ? "12:30" : "11:30",
          status: input.quoteStatus === "Aceptada" ? "Confirmada" : "Pendiente",
          notes: "Agenda demostrativa para validar reunion, entrega o siguiente paso."
        }
      });
    }

    if (input.quoteStatus) {
      const selected = index === 1
        ? [services[0], services[2]]
        : index === 2
          ? [services[0], services[5], services[3]]
          : index === 3
            ? [services[3], services[4]]
            : [services[0], services[1], services[2], services[3], services[5]];
      const subtotal = selected.reduce((sum, item) => sum + Number(item.price), 0);
      const costSubtotal = selected.reduce((sum, item) => sum + Number(item.cost), 0);
      const discount = input.quoteStatus === "Aceptada" ? 900000 : 0;
      const total = subtotal - discount;
      const profit = total - costSubtotal;

      const quote = await prisma.quote.create({
        data: {
          opportunityId: opportunity.id,
          quoteNumber: `QD-${String(index).padStart(4, "0")}`,
          title: `Propuesta ${input.need}`,
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
        },
        include: { items: true }
      });

      if (input.quoteStatus === "Aceptada") {
        await prisma.purchaseTask.createMany({
          data: quote.items.map((item) => ({
            opportunityId: opportunity.id,
            quoteItemId: item.id,
            description: item.description,
            category: "Servicio",
            quantity: item.quantity,
            estimatedCost: item.totalCost,
            supplier: "Equipo interno / proveedor demo",
            status: "Pendiente",
            dueDate: addDays(new Date(), 7),
            notes: `Tarea derivada de ${quote.quoteNumber}.`
          }))
        });

        await prisma.eventScheduleItem.createMany({
          data: [
            ["Kickoff del proyecto", "09:00", "10:00", "Comercial"],
            ["Configuracion base", "10:00", "12:00", "Operaciones"],
            ["Revision con usuario lider", "14:00", "15:00", "Consultor"],
            ["Entrega y cierre de implementacion", "16:00", "17:00", "Operaciones"]
          ].map(([title, startTime, endTime, owner], order) => ({
            opportunityId: opportunity.id,
            scheduleDate: addDays(new Date(), 10 + order),
            title,
            description: "Bloque sugerido para coordinar la ejecucion del negocio ganado.",
            startTime,
            endTime,
            type: "Proyecto",
            owner,
            status: "Pendiente",
            order: order + 1
          }))
        });
      }
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      entityType: "Client",
      entityId: demoClient.id,
      action: "seed",
      summary: "Qora Demo inicializado como CRM generico separado de proyectos verticales."
    }
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
