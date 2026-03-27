import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, Users, Gamepad2 } from "lucide-react";

interface MonthlyStats {
  totalMatches: number;
  totalRevenue: number;
  platformFees: number;
  refereePayout: number;
}

const AdminFinancials = () => {
  const [stats, setStats] = useState<MonthlyStats>({ totalMatches: 0, totalRevenue: 0, platformFees: 0, refereePayout: 0 });
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    };
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const [year, month] = selectedMonth.split("-").map(Number);
      const start = new Date(year, month - 1, 1).toISOString();
      const end = new Date(year, month, 1).toISOString();

      const { data } = await supabase
        .from("matches" as any)
        .select("price, platform_fee, referee_payout")
        .gte("created_at", start)
        .lt("created_at", end);

      const rows = (data || []) as any[];
      setStats({
        totalMatches: rows.length,
        totalRevenue: rows.reduce((s, r) => s + (r.price || 0), 0),
        platformFees: rows.reduce((s, r) => s + (r.platform_fee || 0), 0),
        refereePayout: rows.reduce((s, r) => s + (r.referee_payout || 0), 0),
      });
      setLoading(false);
    };

    fetchStats();
  }, [selectedMonth]);

  const cards = [
    { title: "Partidas", value: stats.totalMatches, icon: Gamepad2, format: (v: number) => String(v) },
    { title: "Receita total", value: stats.totalRevenue, icon: DollarSign, format: (v: number) => `R$ ${v.toLocaleString("pt-BR")}` },
    { title: "Plataforma (30%)", value: stats.platformFees, icon: TrendingUp, format: (v: number) => `R$ ${v.toLocaleString("pt-BR")}` },
    { title: "Repassado (70%)", value: stats.refereePayout, icon: Users, format: (v: number) => `R$ ${v.toLocaleString("pt-BR")}` },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          FINANCEIRO
        </h2>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-6">Carregando...</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {cards.map((c) => (
            <Card key={c.title} className="bg-gradient-card border-border shadow-card">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <c.icon className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wider">{c.title}</span>
                </div>
                <p className="text-2xl font-display">{c.format(c.value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFinancials;
