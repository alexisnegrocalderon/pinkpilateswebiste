# Pink Pilates — sitio y plataforma de gestión

Sitio público y sistema de gestión del estudio Pink Pilates (Reñaca / Viña del Mar).

## Poner a correr el proyecto

```bash
pnpm install
cp .env.example .env        # y completar DATABASE_URL
pnpm db:migrate             # crea las tablas
pnpm db:seed                # catálogo, horario y plantillas de email
pnpm tsx server/db/seed-activity.ts   # alumnas, membresías y reservas de ejemplo
pnpm dev                    # sitio en :3000, API en :3001
```

`pnpm dev` levanta las dos piezas a la vez. Vite hace de proxy de `/api` hacia el
servidor, de modo que el navegador ve un solo origen y la cookie de sesión viaja
correctamente.

### Accesos de la base de ejemplo

| Rol | Email | Contraseña |
|---|---|---|
| Directora | `contacto@pinkpilates.cl` | `pinkpilates2026` |
| Instructora | `antonia@pinkpilates.cl` | `pinkpilates2026` |
| Alumna | `constanza.valdes@ejemplo.cl` | `pinkpilates2026` |

## Cómo está armado

- **`client/`** — sitio en React 19 + Vite. La portada (`pages/Home.tsx`) conserva
  su diseño original; el panel y el portal usan `panel.css` con su propia paleta.
- **`server/`** — API en Express. `app.ts` construye la aplicación sin `listen()`,
  para que sirva tanto al servidor local como a la función serverless de Vercel.
- **`shared/`** — esquema de base de datos (Drizzle), validaciones (zod) y reglas
  de dominio que usan cliente y servidor.

### El modelo de negocio

Todo funciona por **créditos**: un crédito equivale a una clase. Los planes son
una matriz de segmento (adultos, estudiantes, valle, especiales) por periodicidad
por cantidad de créditos, con los precios reales del estudio.

Tres reglas que el sistema hace cumplir solo:

- Los **planes valle** sólo permiten reservar de lunes a viernes entre las 15:00 y
  las 17:00. No es una etiqueta de precio: es una validación en la reserva.
- **Cancelar con menos de 12 horas** cuesta el crédito, pero el cupo se libera
  igual y entra quien esté en lista de espera.
- Los **planes de estudiante** nacen pendientes hasta que la dueña verifica el
  certificado de alumno regular.

### Por qué la reserva es una sola sentencia SQL

`server/sql/bookSpot.sql.ts` descuenta el cupo, descuenta el crédito e inserta la
reserva en una única sentencia con CTEs encadenados. El driver HTTP de Neon no
admite transacciones interactivas, pero tampoco hacen falta: el row lock del
`UPDATE` más la reevaluación del `WHERE` por parte de Postgres resuelven la
carrera por el último cupo. Además la base tiene la última palabra:

- `CHECK (booked_count <= capacity)` — el overbooking es imposible.
- `CHECK (credits_used <= credits_total)` — no se pueden gastar créditos que no existen.
- `EXCLUDE USING gist` — no puede haber dos clases solapadas en la misma sala.
- Índices únicos parciales que hacen idempotentes las reservas, las devoluciones
  de crédito y los webhooks de pago.

### Pagos

`server/payments/` define `PaymentProvider`, una interfaz agnóstica de pasarela.
El adaptador incluido es simulado, pero recorre el flujo real —redirección,
webhook firmado con HMAC, verificación de firma e idempotencia por `event_id`—
para que integrar Mercado Pago, Flow o Transbank sea escribir un archivo nuevo
sin tocar la lógica de negocio.

### Fechas

Ninguna fecha de negocio se calcula con la zona horaria del proceso: las
funciones de Vercel corren en UTC y eso corre el día entre las 21:00 y las 00:00
en Chile. En SQL, "hoy" es siempre `(now() AT TIME ZONE 'America/Santiago')::date`;
en el resto, `shared/domain/time.ts`.

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Sitio y API en modo desarrollo |
| `pnpm build` | Compila el sitio a `dist/public` |
| `pnpm check` | Revisa tipos |
| `pnpm db:generate` | Genera una migración a partir del esquema |
| `pnpm db:migrate` | Aplica las migraciones |
| `pnpm db:seed` | Siembra catálogo y horario |
| `pnpm db:reset` | Borra el esquema (sólo desarrollo) |

### Verificaciones

```bash
pnpm tsx server/db/test-concurrency.ts   # 10 reservas simultáneas sobre 1 cupo
pnpm tsx server/db/test-domain.ts        # las reglas de cancelación, valle y lista de espera
```

## Despliegue

`vercel.json` publica el sitio estático y `api/index.ts` como función serverless.
Variables necesarias en Vercel:

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Cadena **pooled** de Neon (la que dice `-pooler`) |
| `SESSION_SECRET` | Firma de sesiones |
| `MOCK_WEBHOOK_SECRET` | Firma del webhook simulado |
| `CRON_SECRET` | Protege el disparo de tareas programadas |
| `APP_URL` | URL pública, para las vueltas desde la pasarela |

Ojo con dos cosas: la regla de reescritura de `vercel.json` excluye `/api/` del
catch-all del sitio; sin esa exclusión toda la API devolvería el HTML del sitio
con código 200, que es una falla silenciosa difícil de diagnosticar. Y el plan
gratuito de Neon suspende la base tras cinco minutos sin uso, así que el primer
acceso después de una pausa tarda un par de segundos.
