import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, PartyPopper, CalendarDays, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const FIELD_LABELS: Record<string, string> = {
  society: "Society",
  campo: "Campo (11x11)",
  futsal: "Futsal",
  areia: "Futebol de Areia",
};

const PaymentConfirmed = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<any>(null);
  const [error, setError] = useState("");

  const matchId = searchParams.get("match_id");

  const fetchMatch = useCallback(async () => {
    if (!matchId || !user) return;
    const { data } = await supabase
      .from("matches" as any)
      .select("*")
      .eq("id", matchId)
      .single();
    if (data) setMatch(data);
    return data;
  }, [matchId, user]);

  useEffect(() => {
    const init = async () => {
      if (!matchId || !user) {
        setError("Dados de pagamento inválidos");
        setLoading(false);
        return;
      }
      try {
        await fetchMatch();
      } catch (err) {
        console.error("Error fetching match:", err);
        setError("Erro ao buscar dados da partida");
      } finally {
        setLoading(false);
      }
    };
    if (user) init();
  }, [matchId, user, fetchMatch]);

  // Poll for status changes (webhook may confirm it)
  useEffect(() => {
    if (!match || (match as any).status === "confirmed") return;
    const interval = setInterval(async () => {
      const updated = await fetchMatch();
      if ((updated as any)?.status === "confirmed") clearInterval(interval);
    }, 5000);
    return () => clearInterval(interval);
  }, [match, fetchMatch]);

  const isConfirmed = (match as any)?.status === "confirmed";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {loading ? (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : error ? (
            <div className="text-center space-y-4">
              <p className="text-destructive font-semibold">{error}</p>
              <Button onClick={() => navigate("/")} variant="outline">
                Voltar ao início
              </Button>
            </div>
          ) : match ? (
            <div className="space-y-5 text-center">
              <div className="flex justify-center">
                <div className="relative">
                  <div className={`h-20 w-20 rounded-full flex items-center justify-center mx-auto ${isConfirmed ? "bg-green-500/15" : "bg-yellow-500/15"}`}>
                    {isConfirmed ? (
                      <CheckCircle2 className="h-10 w-10 text-green-500" />
                    ) : (
                      <Clock className="h-10 w-10 text-yellow-500 animate-pulse" />
                    )}
                  </div>
                  {isConfirmed && (
                    <PartyPopper className="h-6 w-6 text-accent absolute -top-1 -right-1 animate-bounce" />
                  )}
                </div>
              </div>

              <div>
                {isConfirmed ? (
                  <>
                    <p className="text-lg font-semibold text-foreground">Pagamento confirmado! ✅</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sua partida foi agendada com sucesso. O árbitro já foi notificado!
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-semibold text-foreground">Aguardando confirmação ⏳</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Seu pagamento está sendo processado. Esta página será atualizada automaticamente quando confirmado.
                    </p>
                  </>
                )}
              </div>

              <div className="rounded-lg bg-secondary/50 p-4 text-sm space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modalidade</span>
                  <span>{FIELD_LABELS[(match as any).field_type] || (match as any).field_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duração</span>
                  <span>{(match as any).duration} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Local</span>
                  <span className="text-right max-w-[60%]">{(match as any).location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data</span>
                  <span>{new Date((match as any).scheduled_at).toLocaleString("pt-BR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-medium ${isConfirmed ? "text-green-500" : "text-yellow-500"}`}>
                    {isConfirmed ? "Confirmado" : "Pendente"}
                  </span>
                </div>
                <div className="flex justify-between font-semibold border-t border-border pt-2 mt-1">
                  <span>Valor</span>
                  <span className="text-primary">R$ {(match as any).price}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button onClick={() => navigate("/perfil")} className="w-full font-semibold gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Ver minhas partidas
                </Button>
                <Button variant="outline" onClick={() => navigate("/")} className="w-full font-semibold">
                  Voltar ao início
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentConfirmed;
