import { mensajes, nombresPareja, textos } from "@/config/boda";
import { rellenarMensaje } from "@/lib/mensajes";
import { getResendConfig } from "@/lib/env";

interface InvitationEmailParams {
  toEmail: string;
  guestName: string;
  rsvpUrl: string;
  rsvpDeadline: string;
  dateLabel: string;
  venueName: string;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Plantilla del correo de invitación. Los textos están en `mensajes.correo`
// (src/config/boda.ts); aquí solo la maquetación, con estilos en línea porque
// es lo único que entienden los clientes de correo.
function buildInvitationHtml(params: InvitationEmailParams) {
  const t = mensajes.correo;
  const valores = { nombre: params.guestName, limite: params.rsvpDeadline };
  const accent = "#2052b6";
  const texto = (plantilla: string) => escapeHtml(rellenarMensaje(plantilla, valores));
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(nombresPareja)}</title></head>
<body style="margin:0;padding:24px 12px;background:#f4f5f7;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:8px">
  <tr><td style="padding:28px 28px 0;font-size:13px;color:#6b7280">${escapeHtml(params.dateLabel)} · ${escapeHtml(params.venueName)}</td></tr>
  <tr><td style="padding:6px 28px 20px;font-size:24px;font-weight:700">${escapeHtml(nombresPareja)}</td></tr>
  <tr><td style="padding:0 28px;font-size:15px;line-height:1.6">
    <p style="margin:0 0 12px">${texto(t.saludo)}</p>
    <p style="margin:0 0 24px">${texto(t.texto)}</p>
    <p style="margin:0 0 24px"><a href="${params.rsvpUrl}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:600">${texto(t.boton)}</a></p>
  </td></tr>
  <tr><td style="padding:0 28px 28px;font-size:13px;line-height:1.6;color:#6b7280">
    <p style="margin:0 0 4px">${texto(t.enlaceAlternativo)}</p>
    <p style="margin:0 0 16px"><a href="${params.rsvpUrl}" style="color:${accent};word-break:break-all">${params.rsvpUrl}</a></p>
    <p style="margin:0 0 16px">${texto(t.pie)}</p>
    <p style="margin:0">${escapeHtml(textos.es.firma)}</p>
  </td></tr>
</table>
</body></html>`;
}

export type SendInvitationResult =
  | { ok: true; messageId: string }
  | { ok: false; reason: "no_resend" | "no_email" | "send_error"; message: string };

export async function sendInvitationEmail(params: InvitationEmailParams): Promise<SendInvitationResult> {
  const config = getResendConfig();

  if (!config) {
    return { ok: false, reason: "no_resend", message: "RESEND_API_KEY no configurada." };
  }

  if (!params.toEmail) {
    return { ok: false, reason: "no_email", message: "El invitado no tiene email." };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(config.apiKey);

  const { data, error } = await resend.emails.send({
    from: config.from,
    to: params.toEmail,
    subject: rellenarMensaje(mensajes.correo.asunto, { nombre: params.guestName }),
    html: buildInvitationHtml(params)
  });

  if (error || !data) {
    return { ok: false, reason: "send_error", message: error?.message ?? "Error desconocido al enviar." };
  }

  return { ok: true, messageId: data.id };
}
