import { Music4, Sparkles } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { CopyButton } from "@/components/copy-button";
import { EmptyState } from "@/components/empty-state";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGuests } from "@/lib/data";
import { plural } from "@/lib/format";

export const metadata = { title: "Canciones DJ" };

export default async function CancionesPage() {
  const guests = await getGuests();
  const suggestions = guests
    .filter((g) => g.cancion_sugerida && g.cancion_sugerida.trim().length > 0)
    .sort((a, b) => (a.cancion_sugerida ?? "").localeCompare(b.cancion_sugerida ?? ""));

  const playlistText = suggestions
    .map((g) => `${g.cancion_sugerida} — pedida por ${g.nombre} ${g.apellidos}`)
    .join("\n");

  return (
    <>
      <AdminPageHeader
        eyebrow="DJ"
        title="Canciones sugeridas"
        description="Propuestas que los invitados han dejado en su RSVP. Cópialas y pásalas al DJ."
        actions={
          <>
            <Badge variant="secondary">{suggestions.length} {plural(suggestions.length, "canción", "canciones")}</Badge>
            <Badge variant="outline">{guests.length} invitados</Badge>
          </>
        }
      />

      {suggestions.length === 0 ? (
        <EmptyState
          icon={Music4}
          title="Aún no hay propuestas"
          text="A medida que los invitados confirmen y dejen su canción, irán apareciendo aquí."
        />
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                Lista para copiar
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Una propuesta por línea, con el nombre de quien la sugirió. Pega esto en WhatsApp del DJ o en un doc.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-2xl border border-border/60 bg-background/60 p-4 text-sm leading-7">
                  {playlistText}
                </pre>
                <div className="flex justify-end">
                  <CopyButton text={playlistText} label="Copiar playlist completa" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            {suggestions.map((g) => (
              <Card key={g.id}>
                <CardContent className="flex items-start gap-3 p-4">
                  <Avatar name={g.nombre} surname={g.apellidos} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xl leading-tight">🎵 {g.cancion_sugerida}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {g.nombre} {g.apellidos} · {g.grupo ?? "sin grupo"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}
