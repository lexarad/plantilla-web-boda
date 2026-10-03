"use client";

import { useRef, useState, useTransition } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileDown,
  FileSpreadsheet,
  Upload,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/toast-host";
import { parseCsvRecords } from "@/lib/csv";
import { cn } from "@/lib/utils";

type Row = {
  index: number;
  raw: Record<string, string>;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  grupo: string;
  mesa: string;
  estado: "ok" | "warning" | "error";
  issues: string[];
};

const REQUIRED = ["nombre", "apellidos"] as const;
const OPTIONAL = ["email", "telefono", "grupo", "mesa", "confirmacion_asistencia", "menu_elegido", "alergias_intolerancias", "necesita_autobus", "hotel_alojamiento", "notas_internas"] as const;

function pickField(record: Record<string, string>, ...keys: string[]) {
  for (const k of keys) {
    const v = record[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return "";
}

function validate(records: Record<string, string>[]): Row[] {
  return records.map((raw, i) => {
    const nombre = pickField(raw, "nombre", "name");
    const apellidos = pickField(raw, "apellidos", "surname", "apellido");
    const email = pickField(raw, "email", "correo");
    const telefono = pickField(raw, "telefono", "phone", "movil");
    const grupo = pickField(raw, "grupo", "familia", "group");
    const mesa = pickField(raw, "mesa", "mesa_nombre", "table");

    const issues: string[] = [];
    if (!nombre) issues.push("Falta nombre");
    if (!apellidos) issues.push("Falta apellidos");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) issues.push("Email no válido");

    const estado: Row["estado"] = issues.length === 0 ? "ok" : !nombre || !apellidos ? "error" : "warning";

    return { index: i, raw, nombre, apellidos, email, telefono, grupo, mesa, estado, issues };
  });
}

export function CsvImportPreview({
  action
}: {
  action: (formData: FormData) => Promise<void> | void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);

  const okCount = rows.filter((r) => r.estado === "ok").length;
  const warnCount = rows.filter((r) => r.estado === "warning").length;
  const errCount = rows.filter((r) => r.estado === "error").length;

  async function handleFile(f: File) {
    setFile(f);
    try {
      const text = await f.text();
      const records = parseCsvRecords(text);
      if (records.length === 0) {
        toast({ type: "error", title: "CSV vacío", description: "No se han encontrado filas." });
        setRows([]);
        setHeaders([]);
        return;
      }
      const detectedHeaders = Object.keys(records[0]);
      setHeaders(detectedHeaders);
      setRows(validate(records));
      toast({
        type: "info",
        title: `${records.length} filas leídas`,
        description: "Revisa el preview antes de importar."
      });
    } catch (err) {
      toast({
        type: "error",
        title: "No se pudo leer el archivo",
        description: err instanceof Error ? err.message : "Error desconocido"
      });
    }
  }

  function reset() {
    setFile(null);
    setRows([]);
    setHeaders([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleConfirm() {
    if (!file) return;
    if (errCount > 0) {
      toast({
        type: "error",
        title: `${errCount} filas con error`,
        description: "Corrige el CSV antes de importar."
      });
      return;
    }
    const fd = new FormData();
    fd.append("archivo", file);
    startTransition(async () => {
      try {
        await action(fd);
        toast({
          type: "success",
          title: "Importación lista",
          description: `${okCount + warnCount} invitados creados.`
        });
        reset();
      } catch (err) {
        toast({
          type: "error",
          title: "Error al importar",
          description: err instanceof Error ? err.message : "Error desconocido"
        });
      }
    });
  }

  function downloadTemplate() {
    const cols = ["nombre", "apellidos", "email", "telefono", "grupo", "mesa", "necesita_autobus", "notas_internas"];
    const sample = [
      ["Laura", "García", "laura@example.com", "+34600111222", "Familia", "Mesa 1", "false", "Prima"],
      ["Pablo", "Costa", "pablo@example.com", "+34600333444", "Amigos", "Mesa 3", "true", ""]
    ];
    const lines = [cols.join(","), ...sample.map((r) => r.map((v) => `"${v}"`).join(","))];
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-invitados.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ type: "success", title: "Plantilla descargada" });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-4 text-primary" />
            Importar CSV
          </CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={downloadTemplate}>
            <FileDown className="size-3.5" />
            Plantilla
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {!file ? (
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={cn(
              "group flex cursor-pointer flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-border/60 bg-background/40 p-8 text-center transition-all hover:border-primary/40 hover:bg-primary/5",
              isDragging && "border-primary bg-primary/10 scale-[1.01]"
            )}
          >
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Upload className="size-7" />
            </div>
            <div>
              <p className="font-display text-2xl leading-tight">Arrastra el CSV aquí</p>
              <p className="mt-1 text-sm text-muted-foreground">
                o toca aquí para elegir el archivo
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Columnas mínimas: <code className="font-mono">nombre</code>, <code className="font-mono">apellidos</code>.{" "}
              Opcionales: email, teléfono, grupo, mesa, etc.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </label>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/60 p-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <FileSpreadsheet className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-sm">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {rows.length} filas · {headers.length} columnas detectadas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatChip count={okCount} tone="emerald" icon={CheckCircle2} label="OK" />
                {warnCount > 0 ? <StatChip count={warnCount} tone="amber" icon={AlertTriangle} label="Avisos" /> : null}
                {errCount > 0 ? <StatChip count={errCount} tone="rose" icon={X} label="Errores" /> : null}
                <Button type="button" size="sm" variant="ghost" onClick={reset}>
                  <X className="size-3.5" />
                  Cambiar archivo
                </Button>
              </div>
            </div>

            {/* Headers detected vs expected */}
            <div className="rounded-2xl border border-border/60 bg-background/40 p-3 text-xs">
              <p className="mb-2 font-bold uppercase tracking-[0.18em] text-muted-foreground">Columnas detectadas</p>
              <div className="flex flex-wrap gap-1.5">
                {headers.map((h) => {
                  const isRequired = REQUIRED.includes(h as (typeof REQUIRED)[number]);
                  const isKnown =
                    isRequired ||
                    OPTIONAL.includes(h as (typeof OPTIONAL)[number]) ||
                    ["mesa_nombre", "name", "surname", "phone", "correo", "movil", "familia", "group", "table", "bus"].includes(h);
                  return (
                    <span
                      key={h}
                      className={cn(
                        "rounded-full border px-2 py-0.5 font-mono text-[10px]",
                        isRequired
                          ? "border-primary bg-primary/10 text-primary"
                          : isKnown
                          ? "border-border/60 bg-background text-foreground"
                          : "border-warning/40 bg-warning/10 text-warning"
                      )}
                      title={
                        isRequired ? "Requerida" : isKnown ? "Reconocida" : "Sin mapear (se ignora)"
                      }
                    >
                      {h}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Preview table */}
            <div className="overflow-hidden rounded-2xl border border-border/60">
              <div className="border-b border-border/60 bg-background/60 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Preview · primeras 50 filas
              </div>
              <div className="max-h-96 overflow-auto">
                <table className="w-full min-w-[600px] text-xs">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b border-border/60 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      <th className="px-2 py-2">#</th>
                      <th className="px-2 py-2">Estado</th>
                      <th className="px-2 py-2">Nombre</th>
                      <th className="px-2 py-2">Apellidos</th>
                      <th className="px-2 py-2">Correo</th>
                      <th className="px-2 py-2">Tel</th>
                      <th className="px-2 py-2">Grupo</th>
                      <th className="px-2 py-2">Mesa</th>
                      <th className="px-2 py-2">Avisos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((row) => (
                      <tr
                        key={row.index}
                        className={cn(
                          "border-b border-border/30 last:border-0",
                          row.estado === "error" && "bg-destructive/10",
                          row.estado === "warning" && "bg-warning/10"
                        )}
                      >
                        <td className="px-2 py-1.5 text-muted-foreground">{row.index + 2}</td>
                        <td className="px-2 py-1.5">
                          {row.estado === "ok" ? (
                            <span className="inline-flex items-center gap-1 text-success">
                              <CheckCircle2 className="size-3" /> OK
                            </span>
                          ) : row.estado === "warning" ? (
                            <span className="inline-flex items-center gap-1 text-warning">
                              <AlertTriangle className="size-3" /> ⚠
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-destructive">
                              <X className="size-3" /> err
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 font-medium">{row.nombre || <em className="text-destructive">—</em>}</td>
                        <td className="px-2 py-1.5">{row.apellidos || <em className="text-destructive">—</em>}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{row.email || "—"}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{row.telefono || "—"}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{row.grupo || "—"}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{row.mesa || "—"}</td>
                        <td className="px-2 py-1.5 text-[10px] text-muted-foreground">
                          {row.issues.length > 0 ? row.issues.join(" · ") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 50 ? (
                  <p className="border-t border-border/40 bg-background/50 px-3 py-2 text-center text-[10px] text-muted-foreground">
                    +{rows.length - 50} filas más (todas se importarán)
                  </p>
                ) : null}
              </div>
            </div>

            {/* Confirm */}
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={reset} disabled={pending}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={pending || errCount > 0 || rows.length === 0}
                className="shadow-panel"
              >
                {pending ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Importando…
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    Importar {okCount + warnCount} invitados
                  </>
                )}
              </Button>
            </div>
            {errCount > 0 ? (
              <p className="rounded-md border border-destructive/40 px-3 py-2 text-xs text-destructive">
                ⚠ Hay {errCount} filas con error. Corrige el CSV (revisa nombre/apellidos vacíos) y vuelve a subir.
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StatChip({
  count,
  tone,
  icon: Icon,
  label
}: {
  count: number;
  tone: "emerald" | "amber" | "rose";
  icon: typeof CheckCircle2;
  label: string;
}) {
  const tones = {
    emerald: "border-success/40 bg-success/10 text-success",
    amber: "border-warning/40 bg-warning/10 text-warning",
    rose: "border-destructive/40 bg-destructive/10 text-destructive"
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", tones[tone])}>
      <Icon className="size-3" />
      {count} {label}
    </span>
  );
}
