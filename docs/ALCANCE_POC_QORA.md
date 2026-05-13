# Alcance POC - Qora CRM multi-cliente

## Objetivo del POC

Validar con usuarios reales el flujo interno de un cliente asignado en Qora:

Lead -> oportunidad -> seguimiento -> cotizacion -> aceptacion -> operacion -> alistamiento -> cierre.

El POC ya no se plantea como demo visual. Se plantea como una version piloto para probar roles, datos, responsabilidades y reglas de negocio antes de una salida productiva formal.

## Capacidades POC incluidas

- Inicio de sesion con usuarios internos configurados en base de datos.
- Navegacion por rol: Administrador, Comercial y Operativo.
- Visibilidad de datos segun rol y responsable comercial.
- Leads activos e historicos.
- Deteccion basica de duplicados por correo o telefono.
- Pipeline comercial con bloqueo cuando el negocio pasa a operacion.
- Cotizaciones con catalogo, items personalizados, descuentos, costos internos y margen calculado.
- PDF comercial sin costo, utilidad ni margen.
- Envio de cotizacion a operacion cuando es aceptada.
- Codigo operativo para eventos ganados.
- Expediente operativo unico por evento.
- Ficha de alimentos para chef conectada con lo vendido.
- Compras, contrataciones, cronograma y cierre operativo.
- Tablero financiero interno.
- Reportes de salud del CRM.
- Auditoria de acciones clave.
- Bitacora manual interna por cliente y por evento.

## Que valida cada area

Gerencia:
- Conversion comercial.
- Valor cotizado y ganado.
- Rentabilidad interna.
- Actividades vencidas.
- Cotizaciones sin respuesta.
- Leads sin oportunidad.
- Eventos sin alistamiento.

Comercial:
- Captura y calificacion de leads.
- Bandeja de tareas vencidas y tareas del dia.
- Seguimiento de oportunidades.
- Creacion y estado de cotizaciones.
- Cierre y envio a operacion.

Operacion:
- Recepcion de eventos ganados.
- Alimentos y chef.
- Compras y contrataciones.
- Cronograma.
- Bloqueos.
- Cierre del negocio.

Finanzas / Administracion:
- Costos base del catalogo.
- Utilidad y margen.
- Usuarios, roles y gobierno basico.

## Reglas POC importantes

- El comercial ve su cartera asignada y registros sin asignar.
- El administrador ve toda la informacion.
- El operativo trabaja eventos enviados a operacion.
- Un negocio en operacion no debe moverse libremente en pipeline comercial.
- El margen es interno y nunca debe aparecer en la propuesta del cliente.
- Las notas de bitacora son internas.
- El cierre operativo requiere avance completo de compras y cronograma.

## Fuera del POC

- Pagos.
- Sitio publico.
- SEO.
- WhatsApp API.
- Integracion con Dynamics.
- Firma electronica.
- Envio real de correos.
- Carga real de archivos a almacenamiento externo.
- Seguridad corporativa definitiva con SSO.
- Auditoria legal/compliance avanzada.

## Recomendacion para piloto

Ejecutar el POC con pocos usuarios:

- 1 administrador.
- 1 o 2 comerciales.
- 1 operativo.
- 1 responsable de chef o alimentos.

Durante una semana se deben registrar leads reales o semirreales, crear cotizaciones, aceptar al menos un evento, generar alistamiento y cerrar un expediente operativo.

Al final del piloto se deben revisar:

- Campos faltantes.
- Estados que no representen el proceso real.
- Reportes que Gerencia necesite.
- Permisos por accion.
- Plantilla final de PDF.
- Necesidades de notificacion.
- Adjuntos y documentos obligatorios.

