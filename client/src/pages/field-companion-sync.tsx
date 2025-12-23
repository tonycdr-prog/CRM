import CompanionShell from "@/features/field-companion/companion-shell";
import { useSyncQueue } from "@/hooks/useSyncQueue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, RotateCw, CheckCircle2, AlertCircle, WifiOff } from "lucide-react";

export default function FieldCompanionSync() {
  const { pending, syncing, progress, syncNow } = useSyncQueue();

  const total = progress.sent + progress.remaining;
  const percent = total > 0 ? Math.round((progress.sent / total) * 100) : pending ? 30 : 100;
  const statusIcon = syncing ? RotateCw : pending > 0 ? AlertCircle : CheckCircle2;
  const statusLabel = syncing ? "Syncing" : pending > 0 ? `${pending} pending` : "All clear";

  return (
    <CompanionShell
      title="Sync & Inbox"
      subtitle="Offline aware, no surprises"
      status={<Badge variant="outline">{statusLabel}</Badge>}
      topAction={
        <Button size="sm" className="gap-2" onClick={() => syncNow()} disabled={syncing}>
          <UploadCloud className="h-4 w-4" /> Sync now
        </Button>
      }
    >
      <div className="py-4 space-y-4">
        <Card className="border-border/70 bg-card/70 shadow-sm">
          <CardHeader className="pb-2">
            <p className="text-xs uppercase text-muted-foreground">Status</p>
            <CardTitle className="text-lg flex items-center gap-2">
              {statusIcon === RotateCw && <RotateCw className="h-4 w-4 animate-spin" />} {statusLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <Progress value={percent} className="h-2" />
            <p>{pending ? `${pending} item(s) waiting for upload.` : "Everything synced. Safe to close."}</p>
            <div className="flex items-center gap-2 text-xs">
              <WifiOff className="h-4 w-4" />
              <span>Offline items stay queued; drafts never discarded.</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pending uploads</CardTitle>
            <p className="text-xs text-muted-foreground">Photos, signatures, and form rows waiting to sync</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {pending === 0 && <p>Nothing waiting. You are clear.</p>}
            {pending > 0 && (
              <ul className="list-disc pl-4 space-y-1">
                <li>Evidence attachments queued</li>
                <li>Draft responses saved locally</li>
                <li>Signatures stored with timestamp</li>
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Failed sync</CardTitle>
            <p className="text-xs text-muted-foreground">Review conflicts calmly; nothing lost</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span>No failures detected.</span>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => syncNow()} disabled={syncing}>
              <RotateCw className="h-4 w-4" /> Retry all
            </Button>
          </CardContent>
        </Card>
      </div>
    </CompanionShell>
  );
}
