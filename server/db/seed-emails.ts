/** Plantillas de email del estudio. Editables desde /admin/emails. */

const LOGO_URL = "https://pinkpilateswebiste.vercel.app/assets/pink/pink-pilates-isotipo.png";

const wrap = (body: string) => `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#3A1F2B">
  <div style="background:#FF5C89;padding:24px 24px 28px;text-align:center">
    <img src="${LOGO_URL}" width="40" height="40" alt="" style="display:block;margin:0 auto 10px;width:40px;height:40px" />
    <div style="color:#FFF9F6;font-size:22px;letter-spacing:.14em;font-weight:700">PINK PILATES</div>
    <div style="color:#FFF9F6;opacity:.85;font-size:11px;letter-spacing:.24em;margin-top:6px">PINK, UNLEASHED</div>
  </div>
  <div style="padding:28px 24px;background:#FFF9F6;line-height:1.6">${body}</div>
  <div style="padding:18px 24px;background:#FFDBDB;font-size:12px;color:#8A5A6B;text-align:center">
    Angamos 326, Reñaca · Viña del Mar<br>contacto@pinkpilates.cl
  </div>
</div>`;

export const EMAIL_TEMPLATES = [
  {
    key: "welcome",
    name: "Bienvenida",
    subject: "Bienvenida a Pink Pilates, {{nombre}}",
    sample: { nombre: "Constanza" },
    html: wrap(`<h2 style="margin:0 0 14px">Hola {{nombre}},</h2>
      <p>Tu cuenta ya está creada. Desde tu portal puedes reservar clases, ver tus créditos y manejar tu plan.</p>
      <p>Nos vemos en el reformer.</p>`),
  },
  {
    key: "booking_confirmed",
    name: "Reserva confirmada",
    subject: "Reservaste {{clase}} — {{fecha}} a las {{hora}}",
    sample: { nombre: "Constanza", clase: "Studio Pilates", fecha: "2026-09-10", hora: "19:00", creditos: 7 },
    html: wrap(`<h2 style="margin:0 0 14px">Listo, {{nombre}}</h2>
      <p><strong>{{clase}}</strong><br>{{fecha}} a las {{hora}}</p>
      <p>Te quedan <strong>{{creditos}} créditos</strong>.</p>
      <p style="font-size:13px;color:#8A5A6B">Puedes cancelar sin costo hasta 12 horas antes.</p>`),
  },
  {
    key: "booking_cancelled",
    name: "Reserva cancelada",
    subject: "Cancelaste tu clase",
    sample: { nombre: "Constanza", devuelto: "sí" },
    html: wrap(`<h2 style="margin:0 0 14px">Hola {{nombre}},</h2>
      <p>Tu reserva quedó cancelada. ¿Crédito devuelto? <strong>{{devuelto}}</strong>.</p>`),
  },
  {
    key: "class_cancelled_by_studio",
    name: "Clase cancelada por el estudio",
    subject: "Cancelamos {{clase}} del {{fecha}}",
    sample: { nombre: "Constanza", clase: "Barré", fecha: "2026-09-10", hora: "18:00" },
    html: wrap(`<h2 style="margin:0 0 14px">Lo sentimos, {{nombre}}</h2>
      <p>Tuvimos que cancelar <strong>{{clase}}</strong> del {{fecha}} a las {{hora}}.</p>
      <p><strong>Te devolvimos el crédito completo</strong>, sin importar la antelación.</p>`),
  },
  {
    key: "waitlist_promoted",
    name: "Cupo liberado desde lista de espera",
    subject: "¡Se liberó un cupo en {{clase}}!",
    sample: { nombre: "Constanza", clase: "Studio Pilates", fecha: "2026-09-10", hora: "19:00" },
    html: wrap(`<h2 style="margin:0 0 14px">Buenas noticias, {{nombre}}</h2>
      <p>Se liberó un cupo en <strong>{{clase}}</strong>, {{fecha}} a las {{hora}}, y ya quedaste inscrita.</p>`),
  },
  {
    key: "class_reminder_24h",
    name: "Recordatorio 24 horas antes",
    subject: "Mañana: {{clase}} a las {{hora}}",
    sample: { nombre: "Constanza", clase: "Studio Pilates", hora: "19:00" },
    html: wrap(`<p>Hola {{nombre}}, te esperamos mañana en <strong>{{clase}}</strong> a las {{hora}}.</p>`),
  },
  {
    key: "payment_receipt",
    name: "Comprobante de pago",
    subject: "Tu compra en Pink Pilates — {{orden}}",
    sample: { nombre: "Constanza", orden: "PP-2026-000012", plan: "Adulto Mensual 8", monto: "$96.000", creditos: 8 },
    html: wrap(`<h2 style="margin:0 0 14px">Gracias, {{nombre}}</h2>
      <p>Orden <strong>{{orden}}</strong></p>
      <p>{{plan}} — <strong>{{monto}}</strong><br>{{creditos}} créditos disponibles desde ya.</p>`),
  },
  {
    key: "membership_expiring",
    name: "Plan por vencer",
    subject: "Tu plan vence en {{dias}} días",
    sample: { nombre: "Constanza", dias: 5, creditos: 3 },
    html: wrap(`<h2 style="margin:0 0 14px">Hola {{nombre}},</h2>
      <p>Tu plan vence en <strong>{{dias}} días</strong> y todavía te quedan <strong>{{creditos}} créditos</strong>.</p>
      <p>Los créditos no usados se pierden al vencer, así que aprovéchalos.</p>`),
  },
  {
    key: "credits_low",
    name: "Quedan pocos créditos",
    subject: "Te quedan {{creditos}} créditos",
    sample: { nombre: "Constanza", creditos: 2 },
    html: wrap(`<p>Hola {{nombre}}, te quedan <strong>{{creditos}} créditos</strong>. ¿Renovamos?</p>`),
  },
  {
    key: "password_reset",
    name: "Recuperar contraseña",
    subject: "Recupera tu contraseña",
    sample: { token: "abc123" },
    html: wrap(`<p>Pediste recuperar tu contraseña. El enlace vence en 1 hora.</p>
      <p style="margin:22px 0"><a href="{{appUrl}}/restablecer?token={{token}}"
        style="background:#FF5C89;color:#FFF9F6;padding:12px 22px;border-radius:999px;text-decoration:none">Crear nueva contraseña</a></p>
      <p style="font-size:13px;color:#8A5A6B">Si no fuiste tú, ignora este correo.</p>`),
  },
] as const;
