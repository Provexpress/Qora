# Complemento por area - Qora CRM multi-cliente

Este complemento explica como debe verse la aplicacion desde cada posicion funcional y que cubre la demo actual para una presentacion comercial, gerencial y operativa.

## Gerencia / Administracion

Objetivo: ver salud del negocio, conversion, rentabilidad, alertas y trazabilidad.

Vistas principales:
- Dashboard: resumen ejecutivo del dia.
- Financiero: venta, costo, utilidad y margen interno.
- Reportes: conversion, embudo, origen de leads, reservas, cotizaciones y alertas de salud.
- Usuarios, catalogo y configuracion: gobierno basico del sistema.

Acciones que debe poder explicar:
- Revisar cuantos leads entran y cuantos llegan a cotizacion aceptada.
- Detectar actividades vencidas, cotizaciones sin respuesta y leads sin oportunidad.
- Ver eventos enviados a operacion y su estado.
- Validar utilidad y margen sin mostrar esa informacion al cliente final.
- Auditar la ficha 360 del lead para saber quien creo, edito, envio, acepto o cerro procesos.

Controles agregados:
- Salud del CRM en Reportes.
- Trazabilidad por lead, oportunidad y cotizacion.
- Bloqueo comercial cuando una oportunidad ya paso a operacion.
- Historico de leads cerrados sin eliminarlos.

## Comercial

Objetivo: captar, calificar, hacer seguimiento, cotizar y cerrar.

Vistas principales:
- Comercial: bandeja de trabajo del asesor.
- Leads: entrada de clientes y ficha 360.
- Pipeline: movimiento visual de oportunidades.
- Agenda: llamadas, seguimientos y reservas tentativas.
- Cotizaciones: propuestas, servicios, descuentos y envio a operacion.

Acciones que debe poder explicar:
- Crear lead con datos suficientes.
- Evitar duplicados por correo o telefono.
- Convertir un lead en oportunidad.
- Programar seguimiento.
- Crear cotizacion con items del catalogo o personalizados.
- Validar descuento y costo estimado de items personalizados.
- Enviar cotizacion y marcarla como aceptada, rechazada o vencida.
- Al aceptar, enviar el evento a operacion con codigo.

Controles agregados:
- Bandeja comercial con tareas vencidas, tareas de hoy y cotizaciones frias.
- Bloqueo de pipeline para negocios operativos.
- Rechazo automatico de cotizaciones abiertas al perder oportunidad.
- PDF de cotizacion sin costos, utilidad ni margen.

## Operacion

Objetivo: convertir lo vendido en ejecucion real del evento.

Vistas principales:
- Operacion: bandeja liviana de eventos ganados.
- Expediente operativo: ficha unica del evento.
- Alistamiento: compras, contrataciones y cronograma.
- Agenda: calendario de reservas, zonas y actividades.
- Asignaciones: lectura de responsables.

Acciones que debe poder explicar:
- Abrir evento ganado desde el codigo operativo.
- Ver cliente, fecha, zona, horario, valor, responsable y cotizacion aceptada.
- Traer alimentos vendidos hacia ficha de chef.
- Editar platos, horarios de salida y notas de cocina.
- Generar compras y contrataciones desde lo cotizado.
- Ejecutar cronograma del evento.
- Marcar bloqueos cuando falte proveedor, insumo, definicion o permiso.
- Cerrar negocio solo cuando compras y cronograma estan completos.

Controles agregados:
- KPI de bloqueos en bandeja operativa.
- Ficha unica por evento ganado.
- Boton para imprimir o guardar PDF del expediente operativo.
- Cierre operativo controlado por avance de compras y cronograma.

## Finanzas

Objetivo: leer rentabilidad interna sin contaminar la propuesta del cliente.

Vistas principales:
- Financiero.
- Reportes.
- Cotizaciones.
- Catalogo.

Acciones que debe poder explicar:
- Ver venta cotizada y venta ganada.
- Ver costo estimado, utilidad y margen.
- Revisar margen por cotizacion.
- Mantener costos base desde el catalogo para que el margen sea confiable.
- Revisar items personalizados con costo estimado obligatorio.

Regla clave:
- El margen no se muestra en la cotizacion del cliente.
- El comercial puede usar margen objetivo como guia interna de precio.
- El margen reportado se calcula con venta neta, descuento y costos.

## Flujo demostrable recomendado

1. Entrar con usuario administrador.
2. Abrir Comercial y mostrar tareas vencidas, tareas de hoy y cotizaciones frias.
3. Crear o abrir un lead.
4. Convertirlo en oportunidad.
5. Moverlo en pipeline.
6. Crear cotizacion con catalogo y un item personalizado.
7. Mostrar la vista PDF sin margen.
8. Marcar cotizacion como aceptada.
9. Abrir Operacion y ver el evento con codigo.
10. Abrir expediente operativo.
11. Traer alimentos de cotizacion.
12. Generar alistamiento.
13. Marcar compras, cronograma y bloqueos.
14. Cerrar evento.
15. Ir a Reportes y Financiero para ver impacto.

## Pendientes naturales para una fase productiva

- Autenticacion real con proveedor corporativo.
- Politicas de permisos por accion, no solo por menu.
- Correos reales de envio de cotizacion.
- PDF operativo con plantilla corporativa definitiva.
- Auditoria exportable.
- Motivos parametrizados de perdida, rechazo, bloqueo y cancelacion.
- Notificaciones internas.
- Bitacora de comentarios por evento.

