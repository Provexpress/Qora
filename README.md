# Qora CRM

CRM comercial generico desarrollado por Provexpress para demostraciones, POC y presentaciones de flujo comercial interno. Este repositorio queda separado del proyecto especializado de Hacienda La Julieta.

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
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Abre `http://localhost:3000/login`.

## Separacion De Proyectos

- `Qora`: CRM demo generico para mostrar leads, pipeline, cotizaciones, agenda, postventa, reportes y tablero financiero.
- `HaciendaLaJulietaCRM`: copia local separada para el flujo especializado de eventos, reservas, alimentos, chef y operacion de Hacienda.

## Accesos

Las credenciales no se publican en la interfaz. El seed crea usuarios internos para:

- Admin Provexpress.
- Comercial Demo.
- Operativo Demo.

Las claves iniciales se entregan por canal interno autorizado para cada presentacion o ambiente.

## Funcionalidad

- Login con sesion por cookie y navegacion por rol.
- Portal de cliente/demo separado del CRM para Admin Provexpress.
- Datos CRM genericos para presentaciones comerciales sin exponer informacion de clientes reales.
- Permisos para Administrador, Comercial y Operativo.
- Dashboard con metricas desde base de datos.
- Gestion de leads con busqueda, filtros, creacion, edicion y conversion a oportunidad.
- Ficha 360 de cliente con oportunidades, cotizaciones, actividades, agenda y acceso a postventa.
- Deteccion de duplicados en leads por correo o telefono.
- Pipeline kanban con drag and drop y persistencia.
- Bloqueo comercial de oportunidades ganadas, cerradas o enviadas a postventa.
- Agenda comercial con llamadas, reuniones, tareas y cambio de estado.
- Cotizaciones con servicios, items personalizados, descuento, costos, utilidad y margen.
- Gobierno de margen: Administrador mantiene costos base en catalogo; Comercial define venta/descuento, puede aplicar margen objetivo y estima costos solo en items personalizados.
- PDF de cliente sin costos internos, utilidad, margen ni margen objetivo.
- Estados de cotizacion: borrador, enviada, aceptada, rechazada y vencida.
- Aceptacion de cotizacion con generacion de codigo operativo, tareas, compras, cronograma y activacion de postventa.
- Catalogo de servicios editable por administracion.
- Usuarios y roles administrables.
- Tablero financiero y reportes comerciales.
- Trazabilidad basica de acciones clave sobre leads, oportunidades, cotizaciones y postventa.

## Fuera De Alcance

- Pagos.
- Sitio web publico.
- SEO.
- WhatsApp API.
- Integracion con Dynamics.
- Envio real de correo.
- Firma digital o motor PDF externo.
