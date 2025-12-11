import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Search, Users, FileText, Briefcase, Receipt, Building2 } from "lucide-react";

interface Client {
  id: string;
  companyName: string;
  contactName: string | null;
}

interface Contract {
  id: string;
  title: string;
  contractNumber: string;
  clientId: string | null;
}

interface Job {
  id: string;
  title: string;
  jobNumber: string;
  clientId: string | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  title: string;
  clientId: string | null;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients", user?.id],
    enabled: !!user?.id,
  });

  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/contracts", user?.id],
    enabled: !!user?.id,
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs", user?.id],
    enabled: !!user?.id,
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices", user?.id],
    enabled: !!user?.id,
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "";
    return clients.find(c => c.id === clientId)?.companyName || "";
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
        data-testid="button-global-search"
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search everything...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search clients, contracts, jobs, invoices..." data-testid="input-global-search" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {clients.length > 0 && (
            <CommandGroup heading="Clients">
              {clients.slice(0, 5).map((client) => (
                <CommandItem
                  key={client.id}
                  value={`client-${client.companyName}-${client.contactName || ""}`}
                  onSelect={() => {
                    setLocation(`/clients/${client.id}`);
                    setOpen(false);
                  }}
                  data-testid={`search-result-client-${client.id}`}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <div>
                    <div className="font-medium">{client.companyName}</div>
                    {client.contactName && (
                      <div className="text-xs text-muted-foreground">{client.contactName}</div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {contracts.length > 0 && (
            <CommandGroup heading="Contracts">
              {contracts.slice(0, 5).map((contract) => (
                <CommandItem
                  key={contract.id}
                  value={`contract-${contract.title}-${contract.contractNumber}`}
                  onSelect={() => {
                    setLocation(`/contracts`);
                    setOpen(false);
                  }}
                  data-testid={`search-result-contract-${contract.id}`}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <div>
                    <div className="font-medium">{contract.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {contract.contractNumber} · {getClientName(contract.clientId)}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {jobs.length > 0 && (
            <CommandGroup heading="Jobs">
              {jobs.slice(0, 5).map((job) => (
                <CommandItem
                  key={job.id}
                  value={`job-${job.title}-${job.jobNumber}`}
                  onSelect={() => {
                    setLocation(`/jobs/${job.id}`);
                    setOpen(false);
                  }}
                  data-testid={`search-result-job-${job.id}`}
                >
                  <Briefcase className="mr-2 h-4 w-4" />
                  <div>
                    <div className="font-medium">{job.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {job.jobNumber} · {getClientName(job.clientId)}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {invoices.length > 0 && (
            <CommandGroup heading="Invoices">
              {invoices.slice(0, 5).map((invoice) => (
                <CommandItem
                  key={invoice.id}
                  value={`invoice-${invoice.invoiceNumber}-${invoice.title}`}
                  onSelect={() => {
                    setLocation(`/finance`);
                    setOpen(false);
                  }}
                  data-testid={`search-result-invoice-${invoice.id}`}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  <div>
                    <div className="font-medium">{invoice.invoiceNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {invoice.title} · {getClientName(invoice.clientId)}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
