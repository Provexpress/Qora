# Matriz funcional CRM frente al mercado

Este documento compara Qora CRM con patrones comunes de CRMs comerciales como Odoo CRM, Pipedrive, Zoho CRM y HubSpot CRM. El objetivo no es copiar plataformas completas, sino adoptar las funciones que hacen que el sistema sea operativo, claro y usable para clientes Provexpress.

## Criterio de producto

La aplicacion debe mantenerse liviana:

- Pocas pantallas, pero conectadas.
- Cada dato debe nacer de un proceso real.
- El comercial debe vender y hacer seguimiento.
- Operacion debe recibir un evento claro y ejecutable.
- Administracion debe controlar usuarios, catalogo, costos y rentabilidad.
- El cliente no debe ver informacion interna como costos, utilidad o margen.

## Comparativo funcional

| Capacidad de CRM | Referencia de mercado | Estado en Qora | Decision |
| --- | --- | --- | --- |
| Leads / prospectos | Modulo base en Zoho, Pipedrive y HubSpot | Implementado | Mantener simple con busqueda, filtros y conversion |
| Pipeline visual | Pipedrive y Odoo priorizan pipeline por tarjetas | Implementado | Mantener Kanban con drag and drop |
| Actividades / tareas | Odoo y Pipedrive trabajan seguimiento por actividad | Implementado | Reforzar uso desde Agenda y ficha de cliente |
| Cotizaciones | Odoo conecta oportunidad con cotizacion | Implementado | Mantener PDF externo sin datos internos |
| Catalogo / productos | Odoo y Zoho separan productos/servicios | Implementado | Administrador gobierna precio base y costo |
| Vista 360 del cliente | CRMs muestran historial de contacto, oportunidades y actividades | Implementado | Nueva ficha en Leads |
| Auditoria de cambios | CRMs maduros registran cambios relevantes | Implementado basico | Registrar acciones clave sin sobrecargar |
| Agenda / calendario | CRMs modernos incluyen agenda y tareas | Implementado | Mantener vista por zonas y reservas |
| Reportes / dashboard | HubSpot, Zoho y Pipedrive ofrecen analitica | Implementado | Mantener indicadores accionables, no sobrecargar |
| Roles y permisos | CRMs separan acceso por equipo | Implementado | Roles Administrador, Comercial y Operativo |
| Operacion postventa | CRMs puros suelen requerir extension/proyecto | Implementado a medida | Diferencial para clientes con operación propia |
| Alistamiento / compras | Normalmente seria ERP/proyectos | Implementado a medida | Mantener funcional y enfocado |
| Alimentos / chef | No es CRM generico | Implementado a medida | Mantener como ventaja especifica |
| Automatizaciones complejas | Zoho, HubSpot y Odoo tienen automatizacion avanzada | No priorizado | Evitar por ahora para no volverlo pesado |
| Email marketing / WhatsApp / integraciones | Comun en CRMs grandes | Fuera de alcance | No implementar en esta fase |
| IA / scoring predictivo | Disponible en CRMs maduros | No priorizado | No necesario para version funcional |

## Brechas que ya se cerraron

### Ficha 360 del cliente

Antes, Leads funcionaba como lista. Ahora cada lead tiene una ficha individual con:

- Datos del cliente.
- Responsable.
- Oportunidades asociadas.
- Cotizaciones vinculadas.
- Actividades.
- Reservas.
- Acceso a expediente operativo si el negocio fue ganado.

Esto aproxima la experiencia a un CRM real sin crear un modulo pesado de Contactos o Cuentas.

### Gobierno de margen

La margen no se digita manualmente en reportes. El comercial puede usar margen objetivo para sugerir precio, pero el resultado financiero se calcula desde:

`venta - costo = utilidad`

`utilidad / total neto = margen real`

El PDF de cliente no muestra costo, utilidad, margen ni margen objetivo.

### Gobierno comercial y trazabilidad

Se reforzo el flujo para una demostracion profesional:

- Leads duplicados se bloquean por correo o telefono.
- Si una oportunidad se marca como perdida, el lead pasa al historico.
- Si una oportunidad ya fue enviada a operacion, el pipeline la muestra bloqueada.
- Las acciones clave crean trazabilidad basica en la ficha 360 del cliente.
- Se agregaron indices de base de datos para filtros y listados frecuentes.

### Flujo postventa

Cuando una cotizacion es aceptada, el negocio pasa a operacion con:

- Codigo operativo.
- Reserva.
- Checklist.
- Compras y contrataciones.
- Cronograma.
- Alimentos / chef.
- Cierre del negocio.

Esto es mas especifico que un CRM generico y aporta valor al negocio real.

## Funciones que no conviene agregar todavia

No se recomiendan en esta fase:

- Automatizaciones visuales complejas.
- Constructor de workflows.
- Email marketing masivo.
- WhatsApp API.
- Integracion contable.
- Multiempresa.
- Forecast avanzado.
- Scoring por inteligencia artificial.
- Portal publico de cliente.

Estas funciones pueden hacer crecer el alcance sin mejorar la operacion diaria inmediata.

## Funciones recomendadas para una fase posterior

Cuando el sistema ya este en uso, se pueden evaluar:

1. Importacion/exportacion controlada de leads.
2. Plantillas de correo para envio manual de cotizaciones.
3. Adjuntos internos por evento.
4. Recordatorios automaticos por actividad vencida.
5. Motivos de perdida y analisis de cierres.
6. Probabilidad por etapa para forecast simple.

## Referencias consultadas

- Odoo CRM: https://www.odoo.com/app/crm
- Odoo CRM Features: https://www.odoo.com/app/crm-features
- Pipedrive CRM Features: https://www.pipedrive.com/en/crm/features
- Pipedrive pipeline and activities: https://www.pipedrive.com/en/products/sales/processes-pipeline-activities
- Zoho CRM Features: https://www.zoho.com/crm/features.html
- Zoho CRM Analytics: https://www.zoho.com/crm/analytics-capabilities.html

## Conclusion

Qora ya cubre el nucleo de un CRM funcional: leads, pipeline, actividades, cotizaciones, agenda, roles, reportes y tablero financiero. Su diferencia competitiva esta en conectar el cierre comercial con operacion real del evento.

La recomendacion es mantenerlo compacto, con ficha 360, cotizacion limpia para cliente y alistamiento operativo claro. Asi se ve profesional sin convertirse en una plataforma dificil de operar.

