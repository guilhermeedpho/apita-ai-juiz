import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import RefereeCard from "./RefereeCard";

interface RefereeData {
  id: string;
  user_id: string;
  price_per_match: number;
  field_types: string[];
  region: string | null;
  is_verified: boolean;
  competition_levels?: string[];
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
  reviewCount: number;
  avgRating: number;
}

const FIELD_LABELS: Record<string, string> = {
  society: "Society",
  campo: "Campo (11x11)",
  futsal: "Futsal",
  areia: "Futebol de Areia",
};

const FIXED_PRICES: Record<string, number> = {
  society: 130,
  campo: 200,
  futsal: 100,
  areia: 100,
};

const RefereeList = () => {
  const [referees, setReferees] = useState<RefereeData[]>([]);
  const [loading, setLoading] = useState(true);

  const getAvatarUrl = (avatarUrl: string | null | undefined, fullName?: string) => {
    if (avatarUrl) {
      if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
        return avatarUrl;
      }

      return supabase.storage.from("avatars").getPublicUrl(avatarUrl).data.publicUrl;
    }

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || "A")}&background=1a1a2e&color=2ecc71&bold=true`;
  };

  useEffect(() => {
    const fetchReferees = async () => {
      const { data: refereesData } = await supabase
        .from("referees")
        .select("*");

      if (!refereesData || refereesData.length === 0) {
        setLoading(false);
        return;
      }

      const userIds = refereesData.map((r) => r.user_id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const { data: reviews } = await supabase
        .from("reviews")
        .select("referee_id, rating");

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p])
      );

      const reviewMap = new Map<string, { count: number; total: number }>();
      (reviews || []).forEach((r) => {
        const existing = reviewMap.get(r.referee_id) || { count: 0, total: 0 };
        existing.count++;
        existing.total += r.rating;
        reviewMap.set(r.referee_id, existing);
      });

      const mapped: RefereeData[] = refereesData.map((r) => {
        const profile = profileMap.get(r.user_id);
        const reviewStats = reviewMap.get(r.id) || { count: 0, total: 0 };
        return {
          ...r,
          competition_levels: (r as any).competition_levels || [],
          profile: profile
            ? { full_name: profile.full_name, avatar_url: profile.avatar_url }
            : undefined,
          reviewCount: reviewStats.count,
          avgRating: reviewStats.count > 0 ? reviewStats.total / reviewStats.count : 0,
        };
      });

      setReferees(mapped);
      setLoading(false);
    };

    fetchReferees();
  }, []);

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-5xl md:text-7xl font-display mb-10"
        >
          ÁRBITROS <span className="text-gradient-primary">DISPONÍVEIS</span>
        </motion.h2>

        {loading ? (
          <p className="text-muted-foreground text-center py-8">Carregando árbitros...</p>
        ) : referees.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhum árbitro cadastrado ainda.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {referees.map((ref) => (
              <RefereeCard
                key={ref.id}
                refereeId={ref.id}
                name={ref.profile?.full_name || "Árbitro"}
                region={ref.region || "Não informada"}
                rating={ref.avgRating}
                matches={ref.reviewCount}
                price={ref.price_per_match}
                fieldTypes={ref.field_types.map((ft) => FIELD_LABELS[ft] || ft)}
                rawFieldTypes={ref.field_types}
                competitionLevels={ref.competition_levels}
                isVerified={ref.is_verified}
                avatar={getAvatarUrl(ref.profile?.avatar_url, ref.profile?.full_name)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RefereeList;
