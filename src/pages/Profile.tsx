import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
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
import { Upload, CheckCircle, Clock, XCircle, User, Phone, MapPin, FileText, Shield, DollarSign, Camera, PartyPopper, ArrowRight } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import MyMatches from "@/components/MyMatches";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";
import ContactAdminDialog from "@/components/ContactAdminDialog";

const FIXED_PRICES: Record<string, number> = {
  society: 130,
  campo: 200,
  futsal: 100,
  areia: 100,
};

const PRICE_TABLE: Record<string, Record<number, number>> = {
  society: { 60: 130, 90: 180, 120: 220 },
  campo: { 60: 200, 90: 280 },
  futsal: { 60: 100, 90: 140, 120: 170 },
  areia: { 60: 100, 90: 140, 120: 170 },
};

const FIELD_TYPE_OPTIONS = [
  { value: "society", label: "Society" },
  { value: "campo", label: "Campo (11x11)" },
  { value: "futsal", label: "Futsal" },
  { value: "areia", label: "Futebol de Areia" },
];

const COMPETITION_LEVEL_OPTIONS = [
  { value: "pelada", label: "Pelada / Amador" },
  { value: "competitivo", label: "Competitivo / Liga" },
  { value: "profissional", label: "Profissional" },
];

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refereeMode = searchParams.get("modo") === "arbitro";
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState<"rg" | "cnh" | "cnh-e">("rg");
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Referee state
  const [isReferee, setIsReferee] = useState(false);
  const [fieldTypes, setFieldTypes] = useState<string[]>([]);
  // Prices are now fixed per field type
  const [refereeRegion, setRefereeRegion] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [competitionLevels, setCompetitionLevels] = useState<string[]>([]);
  const [savingReferee, setSavingReferee] = useState(false);
  const [refereeError, setRefereeError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showRefereeSuccess, setShowRefereeSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(refereeMode ? "/auth?modo=cadastro&tipo=arbitro" : "/auth");
    }
  }, [user, authLoading, navigate, refereeMode]);

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
        setAvatarUrl(data.avatar_url || null);
      }
      setProfileLoaded(true);
    };

    const fetchReferee = async () => {
      const { data } = await supabase
        .from("referees")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setIsReferee(true);
        setFieldTypes(data.field_types || []);
        setRefereeRegion(data.region || "");
        setCompetitionLevels((data as any).competition_levels || []);
      }
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
    fetchReferee();
    fetchVerification();
  }, [user]);

  useEffect(() => {
    if (refereeMode && profileLoaded) {
      requestAnimationFrame(() => {
        document.getElementById("referee-registration-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [refereeMode, profileLoaded]);

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

  const handleSaveReferee = async () => {
    if (!user) return;
    if (fieldTypes.length === 0) {
      setRefereeError("Selecione pelo menos um tipo de campo para continuar.");
      document.getElementById("referee-field-types")?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast({ title: "Selecione ao menos um tipo de campo", variant: "destructive" });
      return;
    }

    setRefereeError(null);

    const numericPrices: Record<string, number> = {};
    for (const ft of fieldTypes) {
      numericPrices[ft] = FIXED_PRICES[ft] || 0;
    }

    const avgPrice = Math.round(Object.values(numericPrices).reduce((a, b) => a + b, 0) / fieldTypes.length);

    setSavingReferee(true);

    if (isReferee) {
      // Update existing
      const { error } = await supabase
        .from("referees")
        .update({
          price_per_match: avgPrice,
          field_types: fieldTypes,
          region: refereeRegion.trim() || null,
          prices_by_field: numericPrices,
          competition_levels: competitionLevels,
        } as any)
        .eq("user_id", user.id);

      setSavingReferee(false);
      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Dados de árbitro atualizados!" });
      }
    } else {
      // Create new referee
      const { error } = await supabase
        .from("referees")
        .insert({
          user_id: user.id,
          price_per_match: avgPrice,
          field_types: fieldTypes,
          region: refereeRegion.trim() || null,
          prices_by_field: numericPrices,
          competition_levels: competitionLevels,
        } as any);

      if (!error) {
        // Add referee role
        await supabase.from("user_roles").insert({ user_id: user.id, role: "referee" as const });
        setIsReferee(true);
        setShowRefereeSuccess(true);
        toast({ title: "Cadastro como árbitro realizado!", description: "Agora você aparece na lista de árbitros." });
      } else {
        toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      }
      setSavingReferee(false);
    }
  };

  const toggleFieldType = (value: string) => {
    setRefereeError(null);
    setFieldTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };


  const toggleCompetitionLevel = (value: string) => {
    setCompetitionLevels((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
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

  if (showRefereeSuccess) {
    return (
      <div className="min-h-screen bg-background referee-theme">
        <Navbar />
        <div className="pt-24 pb-16 container mx-auto px-4 max-w-lg flex flex-col items-center justify-center text-center space-y-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="h-28 w-28 rounded-full bg-primary/20 flex items-center justify-center shadow-glow-referee"
          >
            <CheckCircle className="h-14 w-14 text-primary" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <h1 className="text-4xl md:text-5xl font-display">
              CADASTRO <span className="text-gradient-referee">CONCLUÍDO!</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-sm mx-auto">
              Seu perfil de árbitro está ativo. Agora você aparece na lista e pode receber convites para partidas.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 w-full max-w-xs"
          >
            <Button
              size="lg"
              className="flex-1 font-semibold text-lg gap-2"
              onClick={() => navigate("/")}
            >
              Ir para minha área
              <ArrowRight className="h-5 w-5" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-3 gap-6 pt-4 border-t border-border w-full max-w-sm"
          >
            {fieldTypes.map((ft) => (
              <div key={ft} className="text-center">
                <p className="text-xl font-display text-gradient-referee">
                  R${FIXED_PRICES[ft]}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{ft}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  if (authLoading || !profileLoaded) {
    return (
      <div className={`min-h-screen bg-background ${refereeMode ? "referee-theme" : ""}`}>
        <Navbar />
        <div className="pt-24 flex justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${refereeMode ? "referee-theme" : ""}`}>
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 max-w-2xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl">{refereeMode ? "CADASTRO DE ÁRBITRO" : "MEU PERFIL"}</h1>
          {refereeMode && (
            <p className="text-sm text-muted-foreground">
              Complete esta etapa para ativar sua área de árbitro com visual próprio.
            </p>
          )}
        </div>

        {/* Avatar / Photo */}
        <Card className="bg-gradient-card border-border shadow-card">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-28 w-28 sm:h-32 sm:w-32 ring-2 ring-primary/30">
                {avatarUrl ? (
                  <AvatarImage
                    src={supabase.storage.from("avatars").getPublicUrl(avatarUrl).data.publicUrl}
                    alt="Foto"
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="text-3xl bg-muted">
                  {fullName ? fullName.slice(0, 2).toUpperCase() : <Camera className="h-10 w-10" />}
                </AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploadingAvatar}
                  onChange={async (e) => {
                    if (!user || !e.target.files?.[0]) return;
                    const file = e.target.files[0];
                    if (file.size > 3 * 1024 * 1024) {
                      toast({ title: "Máximo 3MB", variant: "destructive" });
                      return;
                    }
                    setUploadingAvatar(true);
                    const ext = file.name.split(".").pop();
                    const path = `${user.id}/avatar.${ext}`;
                    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
                    if (upErr) {
                      toast({ title: "Erro no upload", description: upErr.message, variant: "destructive" });
                      setUploadingAvatar(false);
                      return;
                    }
                    await supabase.from("profiles").update({ avatar_url: path }).eq("user_id", user.id);
                    setAvatarUrl(path);
                    setUploadingAvatar(false);
                    toast({ title: "Foto atualizada!" });
                  }}
                />
              </label>
            </div>
            {!avatarUrl && (
              <p className="text-sm text-destructive text-center font-medium">
                ⚠️ Adicione uma foto com rosto limpo para completar seu perfil
              </p>
            )}
            {uploadingAvatar && <p className="text-xs text-muted-foreground">Enviando...</p>}
          </CardContent>
        </Card>

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

        {/* Referee Registration */}
        <Card
          id="referee-registration-card"
          className={`bg-gradient-card ${refereeMode ? "border-primary/40 shadow-glow-referee" : "border-border shadow-card"}`}
        >
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {isReferee ? "DADOS DE ÁRBITRO" : "QUERO SER ÁRBITRO"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isReferee && (
              <p className="text-sm text-muted-foreground">
                {refereeMode
                  ? "Preencha esta etapa para liberar seu perfil de árbitro e começar a receber convites."
                  : "Cadastre-se como árbitro para aparecer na lista e receber convites para partidas."}
              </p>
            )}

            <div id="referee-field-types" className="space-y-2 scroll-mt-28">
              <div className="flex items-center justify-between gap-3">
                <Label>Tipos de campo e preços</Label>
                {fieldTypes.length > 0 && (
                  <span className="text-xs font-medium text-primary">
                    {fieldTypes.length} selecionado{fieldTypes.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3">
                {FIELD_TYPE_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => toggleFieldType(opt.value)}
                    aria-pressed={fieldTypes.includes(opt.value)}
                    className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                      fieldTypes.includes(opt.value)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        fieldTypes.includes(opt.value)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-transparent"
                      }`}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm flex-1">{opt.label}</span>
                    {fieldTypes.includes(opt.value) && (
                      <span className="text-xs font-medium text-primary">
                        60min: R${PRICE_TABLE[opt.value]?.[60]} | 90min: R${PRICE_TABLE[opt.value]?.[90]}
                        {PRICE_TABLE[opt.value]?.[120] ? ` | 120min: R$${PRICE_TABLE[opt.value][120]}` : ""}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {refereeError && (
                <p className="text-sm font-medium text-destructive">{refereeError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Região de atuação
              </Label>
              <Input
                value={refereeRegion}
                onChange={(e) => setRefereeRegion(e.target.value)}
                placeholder="São Paulo - Zona Sul"
              />
            </div>

            <div className="space-y-2">
              <Label>Nível de competição</Label>
              <div className="grid grid-cols-1 gap-3">
                {COMPETITION_LEVEL_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => toggleCompetitionLevel(opt.value)}
                    aria-pressed={competitionLevels.includes(opt.value)}
                    className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${
                      competitionLevels.includes(opt.value)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-sm">{opt.label}</span>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        competitionLevels.includes(opt.value)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-transparent"
                      }`}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleSaveReferee} disabled={savingReferee} className="w-full font-semibold">
              {savingReferee
                ? "Salvando..."
                : isReferee
                ? "Atualizar dados de árbitro"
                : "Cadastrar como árbitro"}
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
                  Envie uma foto do seu <strong>RG</strong>, <strong>CNH</strong> ou <strong>CNH-e (digital)</strong> para verificar sua identidade.
                  Aceitos: JPG, PNG, WebP ou PDF (máx. 5MB).
                </p>

                <div className="flex gap-2 flex-wrap">
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
                  <Button
                    variant={documentType === "cnh-e" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDocumentType("cnh-e")}
                  >
                    CNH-e (Digital)
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

        {/* My Matches with Chat */}
        <MyMatches />

        {/* Settings */}
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">⚙️ CONFIGURAÇÕES</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ContactAdminDialog />
            <DeleteAccountDialog />
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
