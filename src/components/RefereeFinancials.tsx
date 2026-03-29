import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";

interface RefereeFinancialsProps {
  matches: any[];
}

const RefereeFinancials = ({ matches }: RefereeFinancialsProps) => {
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, number>();
    const confirmed = matches.filter((m) => m.status === "confirmed" || m.status === "completed");

    confirmed.forEach((m) => {
      const d = new Date(m.scheduled_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, (monthMap.get(key) || 0) + (m.referee_payout || 0));
    });

    const months = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, total]) => {
        const [y, m] = key.split("-");
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        return { month: monthNames[parseInt(m) - 1], total };
      });

    return months;
  }, [matches]);

  const thisMonth = useMemo(() => {
    const now = new Date();
    return matches
      .filter(
        (m) =>
          (m.status === "confirmed" || m.status === "completed") &&
          new Date(m.scheduled_at).getMonth() === now.getMonth() &&
          new Date(m.scheduled_at).getFullYear() === now.getFullYear()
      )
      .reduce((s, m) => s + (m.referee_payout || 0), 0);
  }, [matches]);

  if (monthlyData.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h3 className="text-2xl font-display mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        FINANCEIRO
      </h3>
      <Card className="bg-gradient-card border-border shadow-card">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Ganhos nos últimos meses</span>
            <span className="text-sm font-medium">
              Este mês: <span className="text-primary font-display text-lg">R${thisMonth}</span>
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(220 10% 55%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(220 10% 55%)" }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(220 18% 11%)",
                  border: "1px solid hsl(220 15% 20%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`R$${value}`, "Ganhos"]}
              />
              <Bar dataKey="total" fill="hsl(145 70% 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default RefereeFinancials;
