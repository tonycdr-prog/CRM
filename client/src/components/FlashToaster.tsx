// client/src/components/FlashToaster.tsx
import { useEffect } from "react";
import { popFlash } from "@/lib/flash";
import { useToast } from "@/hooks/use-toast";

export function FlashToaster() {
  const { toast } = useToast();

  useEffect(() => {
    const msg = popFlash();
    if (msg) {
      toast({
        title: msg.title,
        description: msg.description,
        variant: msg.variant ?? "default",
      });
    }
  }, [toast]);

  return null;
}
