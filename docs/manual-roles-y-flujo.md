# Manual operativo por rol y flujo

Qora CRM organiza el trabajo por cliente en tres posiciones: Administrador, Comercial y Operativo. Cada rol ve solo los modulos que necesita para evitar ruido y mantener el flujo claro.

## Roles

### Administrador

Responsabilidad: gobierno del sistema, datos maestros y supervision completa.

Accesos principales:
- Dashboard
- Comercial
- Leads
- Pipeline
- Agenda
- Cotizaciones
- Operacion
- Alistamiento
- Financiero
- Reportes
- Catalogo
- Usuarios
- Asignaciones
- Configuracion

Acciones esperadas:
- Crear y administrar usuarios.
- Cambiar roles y restablecer claves.
- Mantener catalogo de servicios, costos base y precios de referencia.
- Revisar reportes, tablero financiero y rentabilidad.
- Auditar el avance comercial y operativo.

### Comercial

Responsabilidad: captar clientes, convertir leads, gestionar oportunidades y cerrar cotizaciones.

Accesos principales:
- Dashboard
- Comercial
- Leads
- Pipeline
- Agenda
- Cotizaciones
- Catalogo en modo consulta
- Reportes comerciales

Acciones esperadas:
- Crear leads con fuente, tipo de evento, fecha tentativa y cantidad de personas.
- Convertir un lead en oportunidad.
- Mover oportunidades por el pipeline.
- Crear actividades de seguimiento.
- Crear cotizaciones con servicios del catalogo o items personalizados.
- Definir precio de venta y descuento.
- Definir margen objetivo para sugerir precios desde los costos disponibles.
- Revisar costo, utilidad y margen calculados.
- Estimar costo solo en items personalizados que no existan en catalogo.
- Enviar cotizaciones y marcarlas como aceptadas, rechazadas o vencidas.
- Al aceptar una cotizacion, enviar el evento a operacion.

### Operativo

Responsabilidad: recibir eventos ganados y convertir lo vendido en ejecucion.

Accesos principales:
- Dashboard operativo
- Agenda
- Operacion
- Alistamiento
- Asignaciones

Acciones esperadas:
- Abrir el expediente de cada evento ganado.
- Confirmar estado operativo.
- Generar alistamiento desde la cotizacion aceptada.
- Revisar compras y contrataciones derivadas de los items vendidos.
- Revisar cronograma del evento, inicio, fin, montaje y cierre.
- Gestionar la ficha de alimentos para chef.
- Marcar compras como en proceso, compradas o contratadas.
- Marcar bloques del cronograma como iniciados o ejecutados.
- Cerrar el negocio cuando compras y cronograma esten completos.

## Flujo principal

1. Lead nuevo
   - El comercial registra el cliente desde Leads.
   - Se asigna responsable, fuente, tipo de evento, fecha tentativa y notas.

2. Oportunidad
   - Desde el lead se crea una oportunidad.
   - La oportunidad entra al pipeline en una etapa comercial.

3. Seguimiento
   - El comercial agenda actividades.
   - Se mueve la oportunidad entre etapas: Nuevo lead, Contactado, En seguimiento, Cotizacion enviada, Reserva tentativa, Confirmado o Perdido.

4. Cotizacion
   - El comercial crea una cotizacion.
   - Puede cargar plantilla por tipo de evento o agregar servicios manuales.
   - El sistema calcula subtotal, descuento, total, costo, utilidad y margen.
   - La margen no se digita manualmente: sale de utilidad / total neto.
   - El comercial puede poner un margen objetivo para que el cotizador sugiera precios de venta.
   - Los costos de servicios del catalogo los gobierna Administrador.
   - La vista PDF permite presentar la propuesta con formato de factura/propuesta.

5. Aceptacion
   - Cuando el cliente acepta, la cotizacion pasa a Aceptada.
   - El sistema genera codigo operativo.
   - La reserva tentativa queda conectada al evento.
   - Se crean bases para tareas, compras, cronograma y alimentos.

6. Operacion
   - El equipo operativo ve el evento en Eventos ganados.
   - El listado es una bandeja liviana.
   - El boton Abrir muestra el expediente completo del evento.

7. Expediente operativo
   - Muestra cliente, fecha, zona, horario, cotizacion aceptada, valor, responsable y estado.
   - Contiene alimentos para chef, checklist operativo, compras, cronograma y cierre.
   - Las acciones bloquean doble envio mientras se guardan.

8. Alistamiento
   - Se genera desde la cotizacion aceptada.
   - Cada item vendido se convierte en compra o contratacion sugerida.
   - El cronograma propone bloques de montaje, ejecucion y cierre.

9. Cierre
   - Cuando compras y cronograma estan al 100%, se habilita Dar cierre al negocio.
   - El evento queda finalizado y disponible para reportes.
   - El lead no se elimina: cambia a Evento finalizado y pasa al historico de Leads.

## Como interpretar cada vista

Dashboard:
- Vista ejecutiva de volumen, actividades y oportunidades.
- Sirve para entrar al dia y detectar prioridades.

Comercial:
- Vista de gestion comercial consolidada.
- Sirve para ver leads, oportunidades, cotizaciones y tareas comerciales desde una sola posicion.

Leads:
- Entrada del CRM.
- Cada lead debe tener suficiente informacion para que otro comercial pueda continuar la gestion.
- La vista abre en Cartera activa; los eventos cerrados quedan consultables en Historico.
- Cada lead tiene una ficha 360 con oportunidades, cotizaciones, actividades, reservas y expediente operativo si aplica.

Pipeline:
- Control visual de etapa comercial.
- Mover una tarjeta representa cambio real de estado de oportunidad.
- Las oportunidades ganadas, cerradas o enviadas a operacion quedan bloqueadas comercialmente para evitar cambios accidentales.
- Al mover una oportunidad a Perdido, el lead pasa al historico y las cotizaciones abiertas se rechazan.

Agenda:
- Vista tipo calendario operativo-comercial.
- Permite ver actividades y reservas por fecha y zona.

Cotizaciones:
- Centro de propuestas.
- La utilidad y margen alimentan tablero financiero y reportes.
- Comercial maneja venta y descuento; Administrador maneja costos base desde Catalogo.
- Comercial puede usar margen objetivo para calcular precios, pero la margen reportada sigue siendo automatica.
- En items personalizados, quien cotiza debe poner costo estimado para no inflar artificialmente la margen.
- La vista PDF para cliente no muestra costo, utilidad, margen ni margen objetivo.
- El descuento no puede superar el subtotal de la propuesta.

Operacion:
- Bandeja de eventos ganados.
- No reemplaza el expediente; solo prioriza que evento abrir.

Expediente operativo:
- Vista unica por evento ganado.
- Es la fuente de verdad para operacion, chef, compras, cronograma y cierre.

Alistamiento:
- Vista de produccion del evento.
- Convierte lo vendido en tareas ejecutables.

Financiero:
- Controla venta, costo, utilidad y margen.
- Distingue cotizado, aceptado y operativo.

Reportes:
- Lee el CRM como plataforma: estado comercial, conversion, rentabilidad y operacion.

Catalogo:
- Base de servicios vendibles.
- Precio y costo deben mantenerse actualizados para que la utilidad sea confiable.
- Si un costo base esta mal, se corrige aqui antes de usarlo como referencia financiera.

Usuarios:
- Administracion basica de accesos.
- Cada usuario debe tener un rol coherente con su funcion real.

Asignaciones:
- Lectura de responsabilidades.
- Ayuda a balancear carga entre comercial y operacion.

Configuracion:
- Contexto del sistema, version, alcance e instructivo.

## Reglas de uso recomendadas

- No aceptar una cotizacion si no representa lo pactado con el cliente.
- No cerrar un evento si compras o cronograma siguen pendientes.
- Mantener catalogo actualizado antes de crear propuestas importantes.
- Usar notas operativas para restricciones, proveedores, cocina y montaje.
- Evitar crear platos manuales duplicados; si ya existe, editar la ficha.
- Cambiar estados desde la vista correspondiente para conservar trazabilidad.
- No reutilizar correo o telefono de un lead existente sin revisar la ficha 360.
- Revisar la trazabilidad de la ficha del cliente antes de tomar una oportunidad que ya fue trabajada.

## Controles de gobierno implementados

- Deteccion de leads duplicados por correo o telefono.
- Trazabilidad basica de creacion, edicion, envio, aceptacion, perdida y cierre.
- Bandeja comercial con tareas vencidas, tareas de hoy y cotizaciones frias.
- Salud gerencial del CRM con leads sin oportunidad, cotizaciones sin respuesta y eventos sin alistamiento.
- KPI de bloqueos operativos para detectar eventos afectados antes del cierre.
- Visibilidad de datos por rol: Administrador ve todo, Comercial ve su cartera y registros sin asignar, Operativo ve eventos enviados a operacion.
- Bitacora manual interna por cliente y evento operativo.
- Bloqueo del pipeline para oportunidades operativas o cerradas.
- Indices de base de datos para filtros frecuentes del CRM.
- Cookies de sesion marcadas como seguras en produccion.

## Fuera de alcance actual

- Pagos.
- Sitio publico.
- SEO.
- WhatsApp API.
- Integracion con Dynamics.
- Firma digital.
- Envio real de correo.

