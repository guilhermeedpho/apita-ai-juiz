import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  message: string;
  time: string;
  read: boolean;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refereeRecordId, setRefereeRecordId] = useState<string | null>(null);

  // Fetch referee record ID
  useEffect(() => {
    if (!user) return;
    supabase
      .from("referees")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setRefereeRecordId(data.id);
      });
  }, [user]);

  // Subscribe to realtime match changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("match-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "matches" },
        (payload) => {
          const match = payload.new as any;
          // Notify referee of new match request
          if (refereeRecordId && match.referee_id === refereeRecordId) {
            const notif: Notification = {
              id: match.id,
              message: "Nova partida agendada para você! 🎉",
              time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
              read: false,
            };
            setNotifications((prev) => [notif, ...prev].slice(0, 20));
            toast({ title: "Nova partida!", description: "Alguém agendou uma partida com você." });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches" },
        (payload) => {
          const match = payload.new as any;
          const old = payload.old as any;

          // Notify requester when referee accepts/rejects
          if (match.requester_id === user.id && old.status !== match.status) {
            if (match.status === "confirmed") {
              // Notify about acceptance
              const acceptNotif: Notification = {
                id: match.id + "-confirmed",
                message: "Seu árbitro aceitou a partida! ✅",
                time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                read: false,
              };
              // Notify about post-match payment
              const payNotif: Notification = {
                id: match.id + "-payment-info",
                message: "💰 Lembrete: o pagamento ao árbitro deve ser realizado após a partida.",
                time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                read: false,
              };
              setNotifications((prev) => [payNotif, acceptNotif, ...prev].slice(0, 20));
              toast({ title: "Árbitro confirmado! ✅", description: "O pagamento será realizado após a partida." });
            } else if (match.status === "cancelled") {
              const notif: Notification = {
                id: match.id + "-cancelled",
                message: "O árbitro recusou a partida ❌",
                time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                read: false,
              };
              setNotifications((prev) => [notif, ...prev].slice(0, 20));
              toast({ title: "Partida recusada", description: "O árbitro recusou a partida." });
            }
          }

          // Notify referee when their match is confirmed (payment info)
          if (refereeRecordId && match.referee_id === refereeRecordId && old.status !== match.status && match.status === "confirmed") {
            const notif: Notification = {
              id: match.id + "-referee-payment-info",
              message: "⚽ Partida confirmada! Lembrete: seu pagamento será realizado após o jogo.",
              time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
              read: false,
            };
            setNotifications((prev) => [notif, ...prev].slice(0, 20));
            toast({ title: "Partida confirmada!", description: "Seu pagamento será após o jogo." });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refereeRecordId, toast]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative" onClick={markAllRead}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b border-border">
          <h4 className="font-display text-sm">NOTIFICAÇÕES</h4>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhuma notificação</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`px-3 py-2.5 border-b border-border last:border-0 text-sm ${
                  n.read ? "opacity-60" : "bg-primary/5"
                }`}
              >
                <p className="text-xs">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
