import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, FileText, CheckCircle, XCircle, Eye, Clock } from "lucide-react";
import AdminFinancials from "@/components/AdminFinancials";
import AdminUsers from "@/components/AdminUsers";
import AdminSupportMessages from "@/components/AdminSupportMessages";
import AdminMatchesManager from "@/components/AdminMatchesManager";
import AdminMetrics from "@/components/AdminMetrics";

interface Verification {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  profile?: { full_name: string; phone: string | null; region: string | null };
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (!user) return;

    const checkAdmin = async () => {
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin" as const,
      });
      if (!data) {
        navigate("/");
        toast({ title: "Acesso negado", description: "Você não tem permissão de admin.", variant: "destructive" });
      } else {
        setIsAdmin(true);
      }
      setChecking(false);
    };

    checkAdmin();
  }, [user, authLoading, navigate, toast]);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchVerifications = async () => {
      setLoading(true);
      let query = supabase
        .from("identity_verifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data } = await query;

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((v) => v.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, phone, region")
          .in("user_id", userIds);

        const profileMap = new Map(
          (profiles || []).map((p) => [p.user_id, p])
        );

        const enriched = data.map((v) => ({
          ...v,
          profile: profileMap.get(v.user_id) || undefined,
        }));

        setVerifications(enriched);
      } else {
        setVerifications([]);
      }
      setLoading(false);
    };

    fetchVerifications();
  }, [isAdmin, filter]);

  const handleAction = async (id: string, userId: string, action: "approved" | "rejected") => {
    const { error } = await supabase
      .from("identity_verifications")
      .update({ status: action, reviewed_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    if (action === "approved") {
      await supabase
        .from("referees")
        .update({ is_verified: true })
        .eq("user_id", userId);
    }

    setVerifications((prev) => prev.filter((v) => v.id !== id));
    toast({ title: action === "approved" ? "Aprovado!" : "Rejeitado!" });
  };

  const viewDocument = async (url: string) => {
    const { data } = await supabase.storage
      .from("identity-documents")
      .createSignedUrl(url, 300);

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    } else {
      toast({ title: "Erro ao abrir documento", variant: "destructive" });
    }
  };

  const docTypeLabels: Record<string, string> = {
    rg: "RG",
    cnh: "CNH",
    "cnh-e": "CNH-e (Digital)",
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex justify-center">
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 max-w-3xl space-y-6">
        <h1 className="text-4xl text-center flex items-center justify-center gap-2">
          <ShieldCheck className="h-8 w-8 text-primary" />
          PAINEL ADMIN
        </h1>

        {/* Overview Metrics */}
        <AdminMetrics />

        {/* Financial Dashboard */}
        <AdminFinancials />

        {/* All Users */}
        <AdminUsers />

        {/* Support Messages */}
        <AdminSupportMessages />

        {/* Matches Manager */}
        <AdminMatchesManager />

        {/* Verification Filters */}
        <div className="flex gap-2 justify-center flex-wrap">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "pending" ? "Pendentes" : f === "approved" ? "Aprovados" : f === "rejected" ? "Rejeitados" : "Todos"}
            </Button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Carregando...</p>
        ) : verifications.length === 0 ? (
          <Card className="bg-gradient-card border-border shadow-card">
            <CardContent className="py-12 text-center">
              <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma verificação {filter === "pending" ? "pendente" : "encontrada"}.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {verifications.map((v) => (
              <Card key={v.id} className="bg-gradient-card border-border shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      {v.profile?.full_name || "Usuário"}
                    </span>
                    <Badge
                      className={
                        v.status === "pending"
                          ? "bg-accent text-accent-foreground"
                          : v.status === "approved"
                          ? "bg-primary text-primary-foreground"
                          : "bg-destructive text-destructive-foreground"
                      }
                    >
                      {v.status === "pending" ? "Pendente" : v.status === "approved" ? "Aprovado" : "Rejeitado"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Documento:</span>{" "}
                      <span className="font-medium">{docTypeLabels[v.document_type] || v.document_type}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Enviado:</span>{" "}
                      <span className="font-medium">
                        {new Date(v.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    {v.profile?.phone && (
                      <div>
                        <span className="text-muted-foreground">Telefone:</span>{" "}
                        <span className="font-medium">{v.profile.phone}</span>
                      </div>
                    )}
                    {v.profile?.region && (
                      <div>
                        <span className="text-muted-foreground">Região:</span>{" "}
                        <span className="font-medium">{v.profile.region}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewDocument(v.document_url)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver documento
                    </Button>
                    {v.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAction(v.id, v.user_id, "approved")}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleAction(v.id, v.user_id, "rejected")}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Admin;
