import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Star, DollarSign, TrendingUp, MapPin, Check, X, Loader2 } from "lucide-react";
import ChatDialog from "./ChatDialog";
import { useToast } from "@/hooks/use-toast";

const FIELD_LABELS: Record<string, string> = {
  society: "Society",
  campo: "Campo (11x11)",
  futsal: "Futsal",
  areia: "Futebol de Areia",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-accent/20 text-accent" },
  confirmed: { label: "Confirmado", className: "bg-primary/20 text-primary" },
  completed: { label: "Concluído", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelado", className: "bg-destructive/20 text-destructive" },
};

const RefereeDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, avgRating: 0, totalEarnings: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleMatchAction = async (matchId: string, action: "confirmed" | "cancelled") => {
    setActionLoading(matchId);
    try {
      const { error } = await supabase
        .from("matches")
        .update({ status: action })
        .eq("id", matchId);

      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        return;
      }

      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, status: action } : m))
      );

      toast({
        title: action === "confirmed" ? "Partida aceita! ✅" : "Partida recusada",
        description: action === "confirmed" ? "O contratante será notificado." : "A partida foi cancelada.",
      });
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Get referee record
      const { data: referee } = await supabase
        .from("referees")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!referee) {
        setLoading(false);
        return;
      }

      // Fetch matches
      const { data: matchesData } = await supabase
        .from("matches")
        .select("*")
        .eq("referee_id", referee.id)
        .order("scheduled_at", { ascending: false });

      // Fetch requester names
      const reqIds = [...new Set((matchesData || []).map((m) => m.requester_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", reqIds);

      const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

      const enriched = (matchesData || []).map((m) => ({
        ...m,
        requesterName: nameMap.get(m.requester_id) || "Contratante",
      }));

      setMatches(enriched);

      // Fetch reviews for stats
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("referee_id", referee.id);

      const totalEarnings = (matchesData || []).reduce((s, m) => s + (m.referee_payout || 0), 0);
      const avgRating =
        reviews && reviews.length > 0
          ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
          : 0;

      setStats({
        total: (matchesData || []).length,
        avgRating,
        totalEarnings,
      });

      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (loading) {
    return <p className="text-center text-muted-foreground py-8">Carregando dashboard...</p>;
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-5xl md:text-7xl font-display mb-10">
          SEU <span className="text-gradient-primary">PAINEL</span>
        </h2>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardContent className="pt-5 pb-4 text-center">
              <CalendarDays className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-display">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Partidas</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card border-border shadow-card">
            <CardContent className="pt-5 pb-4 text-center">
              <Star className="h-5 w-5 text-accent mx-auto mb-1" />
              <p className="text-2xl font-display">{stats.avgRating.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Avaliação</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card border-border shadow-card">
            <CardContent className="pt-5 pb-4 text-center">
              <DollarSign className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-display">R${stats.totalEarnings}</p>
              <p className="text-xs text-muted-foreground">Ganhos</p>
            </CardContent>
          </Card>
        </div>

        {/* Matches list */}
        <h3 className="text-2xl font-display mb-4">SUAS PARTIDAS</h3>
        {matches.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhuma partida agendada ainda.</p>
        ) : (
          <div className="space-y-3">
            {matches.map((m) => {
              const statusInfo = STATUS_LABELS[m.status] || STATUS_LABELS.pending;
              return (
                <Card key={m.id} className="bg-gradient-card border-border shadow-card">
                  <CardContent className="py-4 px-5 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{FIELD_LABELS[m.field_type] || m.field_type}</span>
                        <span className="text-xs text-muted-foreground">• {m.duration}min</span>
                      </div>
                      <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {m.location}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(m.scheduled_at).toLocaleDateString("pt-BR", {
                        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">
                        Contratante: {m.requesterName} • <span className="text-primary font-medium">R${m.referee_payout}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        {m.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-destructive text-destructive hover:bg-destructive/10"
                              disabled={actionLoading === m.id}
                              onClick={() => handleMatchAction(m.id, "cancelled")}
                            >
                              {actionLoading === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><X className="h-3 w-3 mr-1" /> Recusar</>}
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              disabled={actionLoading === m.id}
                              onClick={() => handleMatchAction(m.id, "confirmed")}
                            >
                              {actionLoading === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" /> Aceitar</>}
                            </Button>
                          </>
                        )}
                        <ChatDialog matchId={m.id} otherName={m.requesterName} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default RefereeDashboard;
