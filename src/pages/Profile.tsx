import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle, Clock, XCircle, User, Phone, MapPin, FileText } from "lucide-react";

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState<"rg" | "cnh">("rg");
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setRegion(data.region || "");
        setBio(data.bio || "");
      }
      setProfileLoaded(true);
    };

    const fetchVerification = async () => {
      const { data } = await supabase
        .from("identity_verifications")
        .select("status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setVerificationStatus(data.status);
      }
    };

    fetchProfile();
    fetchVerification();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        region: region.trim() || null,
        bio: bio.trim() || null,
      })
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!" });
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 5MB", variant: "destructive" });
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Tipo inválido", description: "Envie JPG, PNG, WebP ou PDF", variant: "destructive" });
      return;
    }

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("identity-documents")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setUploading(false);
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      return;
    }

    const { error: insertError } = await supabase
      .from("identity_verifications")
      .insert({
        user_id: user.id,
        document_type: documentType,
        document_url: filePath,
        status: "pending",
      });

    setUploading(false);

    if (insertError) {
      toast({ title: "Erro ao registrar", description: insertError.message, variant: "destructive" });
    } else {
      setVerificationStatus("pending");
      toast({ title: "Documento enviado!", description: "Aguarde a análise da equipe." });
    }
  };

  const statusConfig = {
    pending: { label: "Em análise", icon: Clock, color: "bg-accent text-accent-foreground" },
    approved: { label: "Verificado", icon: CheckCircle, color: "bg-primary text-primary-foreground" },
    rejected: { label: "Rejeitado", icon: XCircle, color: "bg-destructive text-destructive-foreground" },
  };

  if (authLoading || !profileLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 max-w-2xl space-y-6">
        <h1 className="text-4xl text-center">MEU PERFIL</h1>

        {/* Profile Info */}
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              DADOS PESSOAIS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> Telefone
                </Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region" className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> Região
                </Label>
                <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="São Paulo - SP" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio / Experiência</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Conte sobre sua experiência como árbitro..."
                rows={3}
              />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="w-full font-semibold">
              {saving ? "Salvando..." : "Salvar perfil"}
            </Button>
          </CardContent>
        </Card>

        {/* Identity Verification */}
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              VERIFICAÇÃO DE IDENTIDADE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {verificationStatus && statusConfig[verificationStatus as keyof typeof statusConfig] && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                {(() => {
                  const cfg = statusConfig[verificationStatus as keyof typeof statusConfig];
                  const Icon = cfg.icon;
                  return (
                    <Badge className={cfg.color}>
                      <Icon className="h-3.5 w-3.5 mr-1" />
                      {cfg.label}
                    </Badge>
                  );
                })()}
              </div>
            )}

            {verificationStatus !== "approved" && (
              <>
                <p className="text-sm text-muted-foreground">
                  Envie uma foto do seu <strong>RG</strong> ou <strong>CNH</strong> para verificar sua identidade.
                  Aceitos: JPG, PNG, WebP ou PDF (máx. 5MB).
                </p>

                <div className="flex gap-2">
                  <Button
                    variant={documentType === "rg" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDocumentType("rg")}
                  >
                    RG
                  </Button>
                  <Button
                    variant={documentType === "cnh" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDocumentType("cnh")}
                  >
                    CNH
                  </Button>
                </div>

                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    {uploading ? "Enviando..." : "Clique para enviar documento"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={handleDocumentUpload}
                    disabled={uploading}
                  />
                </label>
              </>
            )}

            {verificationStatus === "approved" && (
              <p className="text-sm text-primary flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Sua identidade foi verificada com sucesso!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
