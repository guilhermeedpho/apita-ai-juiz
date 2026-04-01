import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Users, CalendarDays, UserPlus } from "lucide-react";

const AdminMetrics = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalReferees, setTotalReferees] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [newUsersThisMonth, setNewUsersThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [profiles, referees, matches, newProfiles] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("referees").select("id", { count: "exact", head: true }),
        supabase.from("matches").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", monthStart),
      ]);

      setTotalUsers(profiles.count || 0);
      setTotalReferees(referees.count || 0);
      setTotalMatches(matches.count || 0);
      setNewUsersThisMonth(newProfiles.count || 0);
      setLoading(false);
    };
    fetch();
  }, []);

  const metrics = [
    { label: "Total Usuários", value: totalUsers, icon: Users, color: "text-primary" },
    { label: "Árbitros", value: totalReferees, icon: BarChart3, color: "text-accent" },
    { label: "Total Partidas", value: totalMatches, icon: CalendarDays, color: "text-primary" },
    { label: "Novos este mês", value: newUsersThisMonth, icon: UserPlus, color: "text-accent" },
  ];

  if (loading) return <p className="text-center text-muted-foreground py-4">Carregando métricas...</p>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {metrics.map((m) => (
        <Card key={m.label} className="bg-gradient-card border-border shadow-card">
          <CardContent className="pt-4 pb-3 text-center">
            <m.icon className={`h-5 w-5 mx-auto mb-1 ${m.color}`} />
            <p className="text-2xl font-display">{m.value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{m.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminMetrics;
