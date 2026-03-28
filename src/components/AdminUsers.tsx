import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, Search, Camera } from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  region: string | null;
  avatar_url: string | null;
  created_at: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, phone, region, avatar_url, created_at")
        .order("created_at", { ascending: false });

      setUsers(data || []);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const filtered = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (u.region || "").toLowerCase().includes(search.toLowerCase())
  );

  const getAvatarUrl = (avatarUrl: string | null) => {
    if (!avatarUrl) return null;
    const { data } = supabase.storage.from("avatars").getPublicUrl(avatarUrl);
    return data.publicUrl;
  };

  const usersWithPhoto = users.filter((u) => u.avatar_url).length;
  const usersWithoutPhoto = users.length - usersWithPhoto;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-display flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          USUÁRIOS ({users.length})
        </h2>
        <div className="flex gap-2 text-xs">
          <Badge variant="outline" className="gap-1">
            <Camera className="h-3 w-3" /> Com foto: {usersWithPhoto}
          </Badge>
          <Badge variant="destructive" className="gap-1">
            Sem foto: {usersWithoutPhoto}
          </Badge>
        </div>
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
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filtered.map((u) => (
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
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-4">Nenhum usuário encontrado.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
