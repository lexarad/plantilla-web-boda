import { nombresPareja, nombresParejaEnFrase, textos } from "@/config/boda";
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

// Plantilla del correo de invitación. Colores y textos neutros: cámbialos a tu
// gusto (los clientes de correo solo entienden estilos en línea).
function buildInvitationHtml(params: InvitationEmailParams) {
  const guestName = escapeHtml(params.guestName);
  const { rsvpUrl, rsvpDeadline, dateLabel, venueName } = params;
  const accent = "#2052b6";
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invitación a nuestra boda</title></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #e3e5e8;border-radius:8px;overflow:hidden">
  <div style="padding:32px 32px 8px">
    <p style="margin:0;color:#6b7280;font-size:13px">Invitación de boda</p>
    <h1 style="margin:8px 0 4px;color:#111827;font-size:26px;font-weight:600">${escapeHtml(nombresPareja)}</h1>
    <p style="margin:0;color:#374151;font-size:15px">${dateLabel} · ${escapeHtml(venueName)}</p>
  </div>
  <div style="padding:24px 32px 32px">
    <p style="margin:0 0 16px;color:#111827;font-size:15px">Hola ${guestName},</p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6">
      Nos encantaría que vinieras. Confirma tu asistencia con tu enlace personal:
    </p>
    <p style="margin:0 0 24px">
      <a href="${rsvpUrl}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:15px;font-weight:600">
        Confirmar asistencia
      </a>
    </p>
    <p style="margin:0 0 4px;color:#6b7280;font-size:13px">O copia este enlace en el navegador:</p>
    <p style="margin:0 0 24px"><a href="${rsvpUrl}" style="color:${accent};font-size:13px;word-break:break-all">${rsvpUrl}</a></p>
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6">
      El enlace es personal y sirve también para cambiar tu respuesta.<br>
      Fecha límite: <strong>${rsvpDeadline}</strong>.
    </p>
  </div>
  <div style="border-top:1px solid #e3e5e8;padding:16px 32px">
    <p style="margin:0;color:#6b7280;font-size:13px">${escapeHtml(textos.es.firma)}</p>
  </div>
</div>
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
    subject: `Invitación a la boda de ${nombresParejaEnFrase.es} — ${params.dateLabel}`,
    html: buildInvitationHtml(params)
  });

  if (error || !data) {
    return { ok: false, reason: "send_error", message: error?.message ?? "Error desconocido al enviar." };
  }

  return { ok: true, messageId: data.id };
}
