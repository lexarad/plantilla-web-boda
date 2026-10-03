import { Card, CardContent, CardHeader } from "@/components/ui/card";

function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`relative overflow-hidden bg-muted/60 ${className}`}>
    <div className="absolute inset-0 shimmer" />
  </div>;
}

export default function AdminLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Shimmer className="h-3 w-24 rounded-full" />
        <Shimmer className="h-10 w-72 rounded-2xl" />
      </div>

      <Shimmer className="h-24 rounded-3xl" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Shimmer className="h-3 w-20 rounded-full" />
              <Shimmer className="mt-3 h-9 w-24 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Shimmer className="h-5 w-44 rounded-md" />
        </CardHeader>
        <CardContent className="grid gap-3">
          <Shimmer className="h-12 rounded-xl" />
          <Shimmer className="h-12 rounded-xl" />
          <Shimmer className="h-12 rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
}
