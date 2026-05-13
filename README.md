# Qora CRM

CRM comercial y operativo multi-cliente desarrollado por Provexpress. Qora permite que cada cliente tenga su propio espacio de trabajo, datos, usuarios, catalogo y operacion asignada.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Componentes estilo shadcn/ui
- Framer Motion
- Lucide React
- Prisma ORM
- PostgreSQL en Neon
- date-fns
- zod
- react-hook-form
- @dnd-kit

## Instalacion

```bash
npm install
```

Copia `.env.example` a `.env` y configura tu cadena de Neon:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/dbname?sslmode=require"
```

Genera Prisma, migra y carga datos iniciales:

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Abre `http://localhost:3000/login`.

## Accesos

Las credenciales de administracion y demostracion no se publican en la interfaz. Se entregan por canal interno autorizado para cada presentacion o ambiente.

El seed crea usuarios iniciales para Admin Provexpress, Qora Demo y el cliente inicial. Las claves iniciales se guardan con hash `scrypt` cuando se ejecuta el seed o cuando el usuario inicia sesion con una clave heredada.

## Funcionalidad

- Login con sesion por cookie y navegacion por rol.
- Portal de clientes separado del CRM para Admin Provexpress.
- Modelo multi-cliente: Admin Provexpress puede cambiar el cliente activo y cada usuario del cliente entra a su espacio asignado.
- Tenant Qora Demo con datos CRM genericos para presentaciones comerciales sin exponer datos de un cliente especifico.
- Tenant cliente inicial con flujo especializado de eventos, cotizacion descargable, reservas, alimentos, compras y alistamiento operativo.
- Permisos para Administrador, Comercial y Operativo.
- Dashboard con metricas desde base de datos.
- Gestion de leads con busqueda, filtros, creacion, edicion y conversion a oportunidad.
- Ficha 360 de cliente con oportunidades, cotizaciones, actividades, reservas y acceso operativo.
- Deteccion de duplicados en leads por correo o telefono.
- Pipeline kanban con drag and drop y persistencia.
- Bloqueo comercial de oportunidades ganadas, cerradas o enviadas a operacion.
- Agenda por zonas con actividades, reservas y cambio de estado.
- Cotizaciones con servicios, items personalizados, descuento, costos, utilidad y margen.
- Gobierno de margen: Administrador mantiene costos base en catalogo; Comercial define venta/descuento, puede aplicar margen objetivo y estima costos solo en items personalizados.
- PDF de cliente sin costos internos, utilidad, margen ni margen objetivo.
- Estados de cotizacion: borrador, enviada, aceptada, rechazada y vencida.
- Aceptacion de cotizacion con generacion de codigo operativo, tareas, compras, cronograma y confirmacion de reservas pendientes.
- Ficha de alimentos para chef generada desde los items vendidos de catering, con platos, cantidades, hora de servicio, notas y estados.
- Catalogo de servicios editable por administracion.
- Usuarios y roles administrables.
- Tablero financiero y reportes comerciales.
- Trazabilidad basica de acciones clave sobre leads, oportunidades, cotizaciones y operacion.
- Indices de base de datos para filtros frecuentes y crecimiento inicial.

## Instructivo Operativo

El manual de uso por rol y flujo completo esta en:

```text
docs/manual-roles-y-flujo.md
```

Incluye responsabilidades de Administrador, Comercial y Operativo, acciones por modulo, flujo desde lead hasta cierre y reglas recomendadas de operacion.

La comparacion funcional frente a CRMs de mercado esta en:

```text
docs/matriz-crm-mercado.md
```

El complemento para presentar la plataforma por area funcional esta en:

```text
docs/complemento-por-area-crm.md
```

El alcance formal de POC esta en:

```text
docs/ALCANCE_POC_QORA.md
```

## Fuera de Alcance

- Pagos.
- Sitio web publico.
- SEO.
- WhatsApp API.
- Integracion con Dynamics.
- Envio real de correo.
- Firma digital o motor PDF externo.
