import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, Search, Camera, Shield, Whistle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  region: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface RefereeWithProfile {
  id: string;
  user_id: string;
  is_verified: boolean;
  price_per_match: number;
  region: string | null;
  field_types: string[];
  competition_levels: string[];
  created_at: string;
  profile?: UserProfile;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [referees, setReferees] = useState<RefereeWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [{ data: profilesData }, { data: refereesData }, { data: rolesData }] = await Promise.all([
        supabase.from("profiles").select("id, user_id, full_name, phone, region, avatar_url, created_at").order("created_at", { ascending: false }),
        supabase.from("referees").select("id, user_id, is_verified, price_per_match, region, field_types, competition_levels, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role").eq("role", "referee" as any),
      ]);

      const allProfiles = profilesData || [];
      const allReferees = refereesData || [];
      const refereeUserIds = new Set((rolesData || []).map(r => r.user_id));

      // Regular users = those WITHOUT referee role
      const regularUsers = allProfiles.filter(p => !refereeUserIds.has(p.user_id));
      setUsers(regularUsers);

      // Referees with their profile info
      const profileMap = new Map(allProfiles.map(p => [p.user_id, p]));
      const enrichedReferees = allReferees.map(r => ({
        ...r,
        profile: profileMap.get(r.user_id),
      }));
      setReferees(enrichedReferees);

      setLoading(false);
    };
    fetchData();
  }, []);

  const getAvatarUrl = (avatarUrl: string | null) => {
    if (!avatarUrl) return null;
    const { data } = supabase.storage.from("avatars").getPublicUrl(avatarUrl);
    return data.publicUrl;
  };

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (u.region || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredReferees = referees.filter(r => {
    const name = r.profile?.full_name || "";
    const region = r.region || r.profile?.region || "";
    return name.toLowerCase().includes(search.toLowerCase()) || region.toLowerCase().includes(search.toLowerCase());
  });

  const usersWithPhoto = users.filter(u => u.avatar_url).length;
  const refereesVerified = referees.filter(r => r.is_verified).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-display flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          GERENCIAR PESSOAS
        </h2>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou região..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-6">Carregando...</p>
      ) : (
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="h-4 w-4" />
              Jogadores ({users.length})
            </TabsTrigger>
            <TabsTrigger value="referees" className="gap-1.5">
              <Shield className="h-4 w-4" />
              Árbitros ({referees.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-2">
            <div className="flex gap-2 text-xs pb-1">
              <Badge variant="outline" className="gap-1">
                <Camera className="h-3 w-3" /> Com foto: {usersWithPhoto}
              </Badge>
              <Badge variant="destructive" className="gap-1">
                Sem foto: {users.length - usersWithPhoto}
              </Badge>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredUsers.map(u => (
                <Card key={u.id} className="bg-gradient-card border-border shadow-card">
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <Avatar className="h-11 w-11 ring-1 ring-border">
                      {u.avatar_url ? (
                        <AvatarImage src={getAvatarUrl(u.avatar_url) || ""} alt={u.full_name} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="text-xs bg-muted">
                        {u.full_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.full_name || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.region || "Sem região"} • {new Date(u.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    {!u.avatar_url && (
                      <Badge variant="outline" className="text-xs text-destructive border-destructive/50">
                        Sem foto
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
              {filteredUsers.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Nenhum jogador encontrado.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="referees" className="space-y-2">
            <div className="flex gap-2 text-xs pb-1">
              <Badge variant="outline" className="gap-1 border-primary/50 text-primary">
                <Shield className="h-3 w-3" /> Verificados: {refereesVerified}
              </Badge>
              <Badge variant="destructive" className="gap-1">
                Não verificados: {referees.length - refereesVerified}
              </Badge>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredReferees.map(r => {
                const name = r.profile?.full_name || "Sem nome";
                const avatar = r.profile?.avatar_url || null;
                return (
                  <Card key={r.id} className="bg-gradient-card border-border shadow-card">
                    <CardContent className="py-3 px-4 flex items-center gap-3">
                      <Avatar className="h-11 w-11 ring-1 ring-border">
                        {avatar ? (
                          <AvatarImage src={getAvatarUrl(avatar) || ""} alt={name} className="object-cover" />
                        ) : null}
                        <AvatarFallback className="text-xs bg-muted">
                          {name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.region || r.profile?.region || "Sem região"} • R$ {r.price_per_match}
                        </p>
                        {r.field_types.length > 0 && (
                          <p className="text-xs text-muted-foreground truncate">
                            {r.field_types.join(", ")}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={r.is_verified ? "default" : "outline"}
                        className={r.is_verified ? "text-xs" : "text-xs text-destructive border-destructive/50"}
                      >
                        {r.is_verified ? "Verificado" : "Pendente"}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredReferees.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Nenhum árbitro encontrado.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AdminUsers;
