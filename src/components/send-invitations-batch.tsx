"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  CheckCircle2,
  ChevronDown,
  Copy,
  Filter,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/toast-host";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { buildRsvpUrl } from "@/lib/rsvp-link";
import { getWeddingDetails } from "@/lib/wedding-details";
import { nombresPareja, nombresParejaEnFrase, textos } from "@/config/boda";

type Guest = {
  id: string;
  nombre: string;
  apellidos: string;
  email: string | null;
  telefono: string | null;
  grupo: string | null;
  codigo_invitacion: string;
  confirmacion_asistencia: string;
  rsvp_view_count: number;
  rsvp_submit_count: number;
};

type Mode = "all_pending" | "never_opened" | "opened_no_response" | "confirmed";

const MODES: Array<{ id: Mode; label: string; hint: string }> = [
  {
    id: "all_pending",
    label: "Todos los pendientes",
    hint: "No han respondido todavía (ni rechazado)."
  },
  {
    id: "never_opened",
    label: "Nunca han abierto el enlace",
    hint: "No han visitado su RSVP. Buen momento para un primer envío."
  },
  {
    id: "opened_no_response",
    label: "Abrieron pero no respondieron",
    hint: "Vieron la invitación y no completaron. Toca recordatorio suave."
  },
  {
    id: "confirmed",
    label: "Ya confirmados",
    hint: "Para enviarles recordatorios del día (bus, dress code…)."
  }
];

// Plantillas por defecto: salen de src/config/boda.ts. Se pueden editar en
// pantalla antes de enviar. {nombre} y {link} se rellenan para cada invitado.
const d = getWeddingDetails("es");
const pareja = nombresParejaEnFrase.es;
const recordatorioBus = d.busEnabled
  ? `\n• Autobús a las ${d.busDeparture} desde ${d.busStopLabel}.\n• Regresos a las ${d.busReturns.join(" y ")}.`
  : "";

const DEFAULT_TEMPLATES: Record<Mode, { wa: string; email: string; subject: string }> = {
  all_pending: {
    wa: `¡Hola {nombre}! Te enviamos tu invitación personal para la boda de ${pareja}, el ${d.dateShort} en ${d.venueName}. Confirma aquí: {link}`,
    email: `Hola {nombre},\n\nNos encantaría que vinieras a nuestra boda el ${d.dateLabel.toLowerCase()} en ${d.venueName} (${d.venueLocation}).\n\nConfirma tu asistencia en tu enlace personal:\n{link}\n\n${textos.es.firma}`,
    subject: `Tu invitación a la boda de ${pareja} · ${d.dateShort}`
  },
  never_opened: {
    wa: `¡Hola {nombre}! Te recordamos tu invitación a la boda de ${pareja}. ¿Pudiste verla? {link}`,
    email: `Hola {nombre},\n\nHace unos días te enviamos la invitación a nuestra boda. Por si no llegó, aquí va de nuevo:\n{link}\n\n${textos.es.firma}`,
    subject: "¿Te llegó nuestra invitación?"
  },
  opened_no_response: {
    wa: "¡Hola {nombre}! Vimos que abriste la invitación pero aún no has confirmado. ¿Nos dices si podrás venir? {link}",
    email: `Hola {nombre},\n\nCuando puedas, confírmanos si vendrás a la boda; así podemos cerrar mesas y catering:\n{link}\n\n${textos.es.firma}`,
    subject: "Recordatorio · Confirma tu asistencia"
  },
  confirmed: {
    wa: `¡Hola {nombre}! Gracias por confirmar. Toda la información del día: {link}`,
    email: `Hola {nombre},\n\nGracias por confirmar. Recordatorio rápido:\n• ${d.dateLabel} — ${d.venueName}.${recordatorioBus}\n\nTu enlace personal sigue activo aquí:\n{link}\n\n${textos.es.firma}`,
    subject: `Detalles del día · Boda ${nombresPareja}`
  }
};

function applyTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

function normalizePhoneForWa(phone: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return null;
  return digits;
}

export function SendInvitationsBatch({ guests, siteUrl }: { guests: Guest[]; siteUrl: string }) {
  const [mode, setMode] = useState<Mode>("all_pending");
  const [wa, setWa] = useState(DEFAULT_TEMPLATES[mode].wa);
  const [email, setEmail] = useState(DEFAULT_TEMPLATES[mode].email);
  const [subject, setSubject] = useState(DEFAULT_TEMPLATES[mode].subject);
  const [expanded, setExpanded] = useState(false);

  function changeMode(next: Mode) {
    setMode(next);
    setWa(DEFAULT_TEMPLATES[next].wa);
    setEmail(DEFAULT_TEMPLATES[next].email);
    setSubject(DEFAULT_TEMPLATES[next].subject);
  }

  const filtered = useMemo(() => {
    switch (mode) {
      case "all_pending":
        return guests.filter((g) => g.confirmacion_asistencia === "pendiente");
      case "never_opened":
        return guests.filter((g) => g.rsvp_view_count === 0);
      case "opened_no_response":
        return guests.filter((g) => g.rsvp_view_count > 0 && g.rsvp_submit_count === 0);
      case "confirmed":
        return guests.filter((g) => g.confirmacion_asistencia === "confirmado");
    }
  }, [mode, guests]);

  const stats = useMemo(() => {
    const withPhone = filtered.filter((g) => normalizePhoneForWa(g.telefono));
    const withEmail = filtered.filter((g) => g.email);
    return { total: filtered.length, phone: withPhone.length, email: withEmail.length };
  }, [filtered]);

  function buildLink(g: Guest) {
    return buildRsvpUrl(siteUrl, g.codigo_invitacion);
  }

  function buildWaUrl(g: Guest) {
    const phone = normalizePhoneForWa(g.telefono);
    const text = applyTemplate(wa, { nombre: g.nombre, link: buildLink(g) });
    if (phone) return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    return buildWhatsappUrl(text);
  }

  function buildMailto(g: Guest) {
    if (!g.email) return "";
    const body = applyTemplate(email, { nombre: g.nombre, link: buildLink(g) });
    return `mailto:${g.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  async function copyAllLinks() {
    const lines = filtered.map(
      (g) => `${g.nombre} ${g.apellidos}\t${g.email ?? ""}\t${g.telefono ?? ""}\t${buildLink(g)}`
    );
    const text = `Nombre\tEmail\tTeléfono\tEnlace\n${lines.join("\n")}`;
    try {
      await navigator.clipboard.writeText(text);
      toast({ type: "success", title: "Lista copiada", description: `${filtered.length} enlaces al portapapeles` });
    } catch {
      toast({ type: "error", title: "No se pudo copiar" });
    }
  }

  async function copyMessageFor(g: Guest) {
    const text = applyTemplate(wa, { nombre: g.nombre, link: buildLink(g) });
    try {
      await navigator.clipboard.writeText(text);
      toast({ type: "success", title: `Mensaje para ${g.nombre}`, description: "Texto en portapapeles" });
    } catch {
      toast({ type: "error", title: "No se pudo copiar" });
    }
  }

  function downloadCsv() {
    const header = "Nombre,Apellidos,Correo,Teléfono,Grupo,Código,Enlace\n";
    const rows = filtered
      .map((g) => {
        const fields = [
          g.nombre,
          g.apellidos,
          g.email ?? "",
          g.telefono ?? "",
          g.grupo ?? "",
          g.codigo_invitacion,
          buildLink(g)
        ];
        return fields.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(",");
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invitaciones-${mode}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ type: "success", title: "CSV descargado", description: `${filtered.length} filas` });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Send className="size-4 text-primary" />
          Envío masivo de invitaciones
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Filtra el grupo a contactar, ajusta el mensaje y abre WhatsApp o el correo con el mensaje ya escrito, con un toque.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4">
        {/* Mode pills */}
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => changeMode(m.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border/60 bg-card text-foreground hover:border-primary/40"
                )}
              >
                <Filter className="mr-1 inline size-3" />
                {m.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">{MODES.find((m) => m.id === mode)?.hint}</p>

        {/* Stats */}
        <div className="grid gap-2 sm:grid-cols-3">
          <Stat icon={Users} label="Destinatarios" value={stats.total} tone="primary" />
          <Stat icon={Phone} label="Con teléfono" value={stats.phone} tone="success" />
          <Stat icon={Mail} label="Con email" value={stats.email} tone="info" />
        </div>

        {/* Templates */}
        <details className="rounded-2xl border border-border/60 bg-background/50">
          <summary
            className="flex cursor-pointer items-center justify-between gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
            onClick={() => setExpanded((v) => !v)}
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" />
              Plantillas (WhatsApp y Email)
            </span>
            <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
          </summary>
          <div className="grid gap-3 p-4 pt-0">
            <div className="grid gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Mensaje WhatsApp
              </label>
              <Textarea
                value={wa}
                onChange={(e) => setWa(e.target.value)}
                rows={3}
                placeholder="Usa {nombre} y {link} para personalizar."
              />
            </div>
            <div className="grid gap-1.5 sm:grid-cols-[1fr_2fr] sm:gap-3">
              <div className="grid gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Asunto del email
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-10 rounded-xl border border-border/60 bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Cuerpo del email
                </label>
                <Textarea value={email} onChange={(e) => setEmail(e.target.value)} rows={5} />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Variables disponibles: <code className="font-mono">{"{nombre}"}</code>{" "}
              <code className="font-mono">{"{link}"}</code>
            </p>
          </div>
        </details>

        {/* Batch actions */}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={copyAllLinks}>
            <Copy className="size-4" />
            Copiar lista enlaces
          </Button>
          <Button type="button" variant="outline" onClick={downloadCsv}>
            <ArrowDownToLine className="size-4" />
            Descargar CSV
          </Button>
        </div>

        {/* Per-guest rows */}
        <div className="rounded-2xl border border-border/60 bg-background/50">
          <div className="border-b border-border/60 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Lista ({filtered.length})
          </div>
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              ✓ No hay nadie en este filtro
            </p>
          ) : (
            <ul className="max-h-[28rem] divide-y divide-border/40 overflow-y-auto">
              {filtered.map((g) => {
                const waUrl = buildWaUrl(g);
                const mailUrl = buildMailto(g);
                const hasPhone = !!normalizePhoneForWa(g.telefono);
                return (
                  <li key={g.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {g.nombre} {g.apellidos}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {g.email ?? "sin email"} · {g.telefono ?? "sin tel"} · {g.grupo ?? "sin grupo"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button asChild size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px]">
                        <a href={waUrl} target="_blank" rel="noreferrer">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="size-3">
                            <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.821 11.821 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.554-5.338 11.89-11.893 11.89a11.9 11.9 0 0 1-5.688-1.448L.057 24z" />
                          </svg>
                          {hasPhone ? "WA" : "WA*"}
                        </a>
                      </Button>
                      {mailUrl ? (
                        <Button asChild size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px]">
                          <a href={mailUrl}>
                            <Mail className="size-3" />
                            Correo
                          </a>
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 px-2 text-[11px]"
                        onClick={() => copyMessageFor(g)}
                      >
                        <Copy className="size-3" />
                        Copiar
                      </Button>
                      {g.confirmacion_asistencia === "confirmado" ? (
                        <CheckCircle2 className="size-4 text-success" />
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground">
          <strong>WA*</strong>: el invitado no tiene teléfono — abre WhatsApp con el mensaje listo y eliges el contacto manualmente.
        </p>
      </CardContent>
    </Card>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone: "primary" | "success" | "info";
}) {
  const tones = {
    primary: "border-primary/30 bg-primary/5 text-primary",
    success: "border-success/30 bg-success/10 text-success",
    info: "border-info/30 bg-info/10 text-info"
  };
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border p-3", tones[tone])}>
      <div className="flex size-9 items-center justify-center rounded-xl bg-card shadow-sm">
        <Icon className="size-4" />
      </div>
      <div>
        {/* Sin opacity: a 10px en negrita bajaba el contraste por debajo de AA (medido con axe). */}
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]">{label}</p>
        <p className="font-display text-2xl leading-none tabular-nums">{value}</p>
      </div>
    </div>
  );
}
