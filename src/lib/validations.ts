import { z } from "zod";

export const leadSchema = z.object({
  fullName: z.string().min(3, "Nombre requerido"),
  phone: z.string().min(7, "Telefono requerido"),
  email: z.string().email("Correo invalido"),
  source: z.string().min(2),
  eventType: z.string().min(2),
  estimatedDate: z.string().optional(),
  peopleCount: z.coerce.number().int().positive(),
  status: z.string().min(2),
  notes: z.string().optional(),
  assignedUserId: z.string().min(1)
});

export const opportunitySchema = z.object({
  leadId: z.string().min(1),
  title: z.string().min(3),
  stageId: z.string().min(1),
  estimatedValue: z.coerce.number().nonnegative(),
  priority: z.string().min(1),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional(),
  assignedUserId: z.string().min(1)
});

export const serviceSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative(),
  cost: z.coerce.number().nonnegative().default(0),
  active: z.coerce.boolean().default(true)
});

export const activitySchema = z.object({
  opportunityId: z.string().min(1),
  userId: z.string().min(1),
  title: z.string().min(3),
  description: z.string().optional(),
  activityDate: z.string().min(1),
  type: z.string().min(1),
  status: z.string().min(1)
});

export const reservationSchema = z.object({
  opportunityId: z.string().min(1),
  spaceId: z.string().min(1),
  reservationDate: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  status: z.string().min(1),
  notes: z.string().optional()
});

export const quoteSchema = z.object({
  opportunityId: z.string().min(1),
  title: z.string().min(3),
  status: z.string().min(1),
  discount: z.coerce.number().nonnegative().default(0),
  validUntil: z.string().min(1),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        serviceItemId: z.string().optional(),
        description: z.string().min(2),
        quantity: z.coerce.number().positive(),
        unitPrice: z.coerce.number().nonnegative(),
        unitCost: z.coerce.number().nonnegative().default(0)
      })
    )
    .min(1)
});

export const userSchema = z.object({
  name: z.string().min(3, "Nombre requerido"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(4, "Clave mínima de 4 caracteres"),
  roleId: z.string().min(1, "Rol requerido")
});

export const userRoleSchema = z.object({
  roleId: z.string().min(1, "Rol requerido")
});

export const passwordResetSchema = z.object({
  password: z.string().min(4, "Clave mínima de 4 caracteres")
});

export const clientSchema = z.object({
  name: z.string().min(3, "Nombre requerido"),
  slug: z.string().optional(),
  description: z.string().optional(),
  status: z.string().default("Activo")
});
