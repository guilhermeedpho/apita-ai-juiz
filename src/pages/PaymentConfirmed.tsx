import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, PartyPopper, CalendarDays, Loader2 } from "lucide-react";
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
  const nsu = searchParams.get("nsu");

  useEffect(() => {
    const confirmAndFetch = async () => {
      if (!matchId || !user) {
        setError("Dados de pagamento inválidos");
        setLoading(false);
        return;
      }

      try {
        // Only fetch match details - do NOT auto-confirm
        // Payment confirmation is done manually by admin after verifying PIX
        const { data, error: fetchError } = await supabase
          .from("matches" as any)
          .select("*")
          .eq("id", matchId)
          .single();

        if (fetchError) throw fetchError;
        setMatch(data);
      } catch (err) {
        console.error("Error confirming payment:", err);
        setError("Erro ao confirmar pagamento");
      } finally {
        setLoading(false);
      }
    };

    if (user) confirmAndFetch();
  }, [matchId, user]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {loading ? (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Confirmando pagamento...</p>
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
                  <div className="h-20 w-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-10 w-10 text-primary" />
                  </div>
                  <PartyPopper className="h-6 w-6 text-accent absolute -top-1 -right-1 animate-bounce" />
                </div>
              </div>

              <div>
                <p className="text-lg font-semibold text-foreground">Pagamento enviado! ⏳</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Seu pagamento está sendo verificado. A partida será confirmada assim que o admin aprovar o PIX.
                </p>
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
                <div className="flex justify-between font-semibold border-t border-border pt-2 mt-1">
                  <span>Valor pago</span>
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
