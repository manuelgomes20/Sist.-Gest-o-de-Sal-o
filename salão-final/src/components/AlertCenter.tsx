import { Bell, Package, Calendar, Trash2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSmartAlerts } from "@/lib/alertsEngine";
import { cn } from "@/lib/utils";

const AlertCenter = () => {
  const { inbox, unread, markAllRead, remove, clear } = useSmartAlerts();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Alertas">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="p-3 border-b flex items-center justify-between">
          <p className="font-semibold text-sm">Alertas inteligentes</p>
          <div className="flex items-center gap-1">
            {inbox.length > 0 && (
              <>
                <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-xs" onClick={markAllRead}>
                  <CheckCheck className="h-3 w-3" /> Lidos
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-xs" onClick={clear}>
                  <Trash2 className="h-3 w-3" /> Limpar
                </Button>
              </>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-96">
          {inbox.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Sem alertas no momento 🎉</p>
          ) : (
            <ul className="divide-y">
              {inbox.map(a => {
                const Icon = a.type === "stock" ? Package : Calendar;
                return (
                  <li key={a.id} className={cn("p-3 flex items-start gap-2 hover:bg-muted/40 transition-colors", !a.read && "bg-primary/5")}>
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      a.severity === "critical" && "bg-destructive/15 text-destructive",
                      a.severity === "warning" && "bg-amber-500/15 text-amber-600",
                      a.severity === "info" && "bg-primary/15 text-primary",
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight">{a.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(a.createdAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(a.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default AlertCenter;
