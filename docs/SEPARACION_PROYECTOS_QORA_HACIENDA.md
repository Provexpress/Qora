# Separacion de proyectos

## Qora

Este repositorio queda como CRM demo generico para presentaciones comerciales:

- Leads y clientes.
- Pipeline comercial.
- Agenda de llamadas, reuniones y tareas.
- Cotizaciones con costos internos, utilidad y margen.
- PDF comercial sin margen visible para el cliente.
- Postventa para proyectos ganados.
- Alistamiento, compras, cronograma y cierre.
- Reportes y tablero financiero.

El seed de Qora crea solo el tenant `Qora Demo` y usuarios demo genericos.

## Hacienda La Julieta

El flujo especializado de Hacienda queda separado en la carpeta local:

```text
../HaciendaLaJulietaCRM
```

Ese proyecto conserva la logica vertical de eventos:

- Reservas por zonas o espacios.
- Alimentos y ficha para chef.
- Cronograma de evento.
- Servicios propios de eventos.
- Datos y usuarios del cliente Hacienda.

## Motivo

Qora debe servir como demo CRM reutilizable para distintos clientes. Hacienda es un caso vertical con reglas de negocio especificas, por eso no debe condicionar el demo generico ni aparecer mezclado en sus datos, textos o seed.
