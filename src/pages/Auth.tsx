import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

const signInSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const refereeMode = searchParams.get("tipo") === "arbitro";
  const [isLogin, setIsLogin] = useState(searchParams.get("modo") !== "cadastro");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    setIsLogin(searchParams.get("modo") !== "cadastro");
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      navigate(refereeMode ? "/perfil?modo=arbitro" : "/");
    }
  }, [user, navigate, refereeMode]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse({ fullName, email, password });
    if (!parsed.success) {
      toast({ title: "Erro", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.fullName },
        emailRedirectTo: refereeMode ? `${window.location.origin}/perfil?modo=arbitro` : window.location.origin,
      },
    });
    setLoading(false);

    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: refereeMode ? "Cadastro de árbitro iniciado!" : "Cadastro realizado!",
      description: "Confira seu email para confirmar a conta.",
    });
    setIsLogin(true);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast({ title: "Erro", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      navigate(refereeMode ? "/perfil?modo=arbitro" : "/");
    }
  };

  return (
    <div className={`min-h-screen bg-background flex flex-col items-center justify-center px-4 ${refereeMode ? "referee-theme" : ""}`}>
      <button onClick={() => navigate("/")} className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm">Voltar</span>
      </button>

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center justify-center gap-2 mb-8">
          {refereeMode && (
            <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary shadow-glow-referee">
              Área do Árbitro
            </span>
          )}
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="font-display text-3xl">APITAJÁ</span>
          </div>
        </div>

        <div className={`bg-card border rounded-2xl p-6 ${refereeMode ? "border-primary/40 shadow-glow-referee" : "border-border"}`}>
          <h2 className="font-display text-2xl text-center mb-2">
            {isLogin ? (refereeMode ? "ENTRAR COMO ÁRBITRO" : "ENTRAR") : (refereeMode ? "CADASTRO DE ÁRBITRO" : "CADASTRAR")}
          </h2>

          {refereeMode && !isLogin && (
            <p className="text-center text-sm text-muted-foreground mb-6">
              Crie sua conta para seguir direto para a área azul de cadastro do árbitro.
            </p>
          )}

          <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading ? "Aguarde..." : isLogin ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "Cadastre-se" : "Entre"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
