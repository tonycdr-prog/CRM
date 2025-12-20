import { PropsWithChildren, ReactNode, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ExternalLink, Maximize2, RefreshCw, Send, Tv, X } from "lucide-react";
import { cn } from "@/lib/utils";

type WidgetFrameProps = PropsWithChildren<{
  widgetId: string;
  title: string;
  description?: string;
  supportsExpand?: boolean;
  supportsNewTab?: boolean;
  supportsSendToScreen?: boolean;
  supportsRefreshAction?: boolean;
  params?: Record<string, unknown>;
  headerExtras?: ReactNode;
  footer?: ReactNode;
  className?: string;
  onRefresh?: () => void;
}>; 

export function WidgetFrame({
  widgetId,
  title,
  description,
  supportsExpand = true,
  supportsNewTab = true,
  supportsSendToScreen = false,
  supportsRefreshAction = false,
  params,
  headerExtras,
  footer,
  className,
  children,
  onRefresh,
}: WidgetFrameProps) {
  const [expanded, setExpanded] = useState(false);

  const newTabHref = useMemo(() => {
    const search = params && Object.keys(params).length
      ? `?params=${encodeURIComponent(JSON.stringify(params))}`
      : "";
    return `/dashboard/widget/${encodeURIComponent(widgetId)}${search}`;
  }, [params, widgetId]);

  return (
    <>
      <Card className={cn("border-primary/30", className)}>
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {description ? <CardDescription>{description}</CardDescription> : null}
            </div>
            <div className="flex items-center gap-1">
              {headerExtras}
              {supportsRefreshAction && onRefresh ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={onRefresh}>
                        <RefreshCw className="h-4 w-4" />
                        <span className="sr-only">Refresh widget</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Refresh</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
              {supportsNewTab ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={newTabHref} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">Open widget in new tab</span>
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Open in new tab</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
              {supportsSendToScreen ? (
                <DropdownMenu>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Tv className="h-4 w-4" />
                            <span className="sr-only">Send to screen</span>
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Send to Screen</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <DropdownMenuContent align="end">
                    {[1, 2, 3].map((screenId) => (
                      <DropdownMenuItem
                        key={screenId}
                        onSelect={() =>
                          window.open(
                            newTabHref,
                            `lso-screen-${screenId}`,
                            "noopener,noreferrer,width=1200,height=800",
                          )
                        }
                      >
                        <Send className="mr-2 h-4 w-4" /> Screen {screenId}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
              {supportsExpand ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setExpanded(true)}>
                        <Maximize2 className="h-4 w-4" />
                        <span className="sr-only">Expand widget</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Expand</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">{children}</CardContent>
        {footer ? <CardFooter>{footer}</CardFooter> : null}
      </Card>

      {supportsExpand ? (
        <Dialog open={expanded} onOpenChange={setExpanded}>
          <DialogContent className="max-w-6xl w-[95vw] h-[90vh]">
            <div className="flex items-center justify-between gap-2 border-b pb-3">
              <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                {description ? (
                  <p className="text-sm text-muted-foreground">{description}</p>
                ) : null}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setExpanded(false)}>
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <div className="h-full overflow-auto py-2">{children}</div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
