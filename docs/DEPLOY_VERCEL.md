# Despliegue de Qora en Vercel

Esta guia deja Qora listo para que un tercero pueda entrar, navegar tenants y probar el CRM desde una URL publica de Vercel.

## 1. Preparar base de datos Neon

1. Crear o usar un proyecto existente en Neon.
2. Copiar la cadena `DATABASE_URL` de la base de datos.
3. Usar una base separada para demo/staging si el jefe va a probar libremente.

Formato esperado:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
```

## 2. Subir codigo a GitHub

El remoto actual del proyecto apunta a:

```text
https://github.com/Provexpress/Qora.git
```

Antes de importar en Vercel, confirmar que los cambios esten en GitHub:

```bash
git status
git add .
git commit -m "Prepare Qora for Vercel demo"
git push origin main
```

## 3. Importar proyecto en Vercel

1. Entrar a Vercel.
2. Importar el repositorio `Provexpress/Qora`.
3. Framework: Next.js.
4. Build command: `npm run build`.
5. Install command: `npm install`.
6. Output directory: dejar vacio/default.

## 4. Configurar variables de entorno

En Vercel, ir a:

```text
Project Settings -> Environment Variables
```

Agregar:

```bash
DATABASE_URL="postgresql://..."
```

Aplicar para `Production`, y tambien `Preview` si se van a probar ramas o despliegues previos.

## 5. Aplicar migraciones

Para produccion o demo publica se usa:

```bash
npm run prisma:deploy
```

Opciones:

- Ejecutarlo localmente apuntando `.env` a la base Neon de demo.
- O ejecutarlo desde una terminal con acceso al proyecto y la misma `DATABASE_URL`.

No usar `prisma migrate dev` en produccion.

## 6. Cargar datos iniciales

Para dejar Qora con tenants, usuarios y datos de demostracion:

```bash
npm run prisma:seed
```

Importante: el seed actual reinicia datos de demo. Usarlo solo en la base de demo/staging, no en una base con datos reales.

## 7. Desplegar

Despues de variables y migraciones:

```bash
git push origin main
```

Vercel desplegara automaticamente. Al terminar, compartir la URL de Production con el jefe.

## 8. Flujo recomendado para mostrar

1. Ingresar como Admin Provexpress.
2. Abrir el portal de clientes.
3. Seleccionar `Qora Demo` para mostrar un CRM generico.
4. Recorrer dashboard, leads, pipeline, cotizaciones, agenda y reportes.
5. Seleccionar el cliente inicial para mostrar el flujo especializado: cotizacion descargable, reserva, alimentos/chef, compras, alistamiento y operacion.

## 9. Reglas para demo segura

- No publicar credenciales en el login.
- Usar una base Neon separada para demostracion.
- No ejecutar seed en una base con informacion real.
- Si el jefe va a editar datos libremente, crear usuarios de prueba desde el portal de clientes.
- Si se rompe la data de demo, restaurar ejecutando `npm run prisma:seed` contra la base demo.
