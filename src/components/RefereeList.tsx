import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";
import RefereeCard from "./RefereeCard";
import RefereeCardSkeleton from "./RefereeCardSkeleton";

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

export interface RefereeFilters {
  region?: string;
  fieldType?: string;
  location?: string;
}

interface RefereeListProps {
  filters?: RefereeFilters;
}

const RefereeList = ({ filters }: RefereeListProps) => {
  const { user } = useAuth();
  const [referees, setReferees] = useState<RefereeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [randomReferee, setRandomReferee] = useState<RefereeData | null>(null);

  const pickRandomReferee = () => {
    const filtered = getFilteredReferees();
    if (filtered.length === 0) return;
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    setRandomReferee(random);
  };

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
      const { data: refereesData } = await supabase.from("referees").select("*");

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

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

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

  const getFilteredReferees = () => {
    let filtered = referees;

    if (filters?.region) {
      filtered = filtered.filter(
        (r) => r.region?.toLowerCase().includes(filters.region!.toLowerCase())
      );
    }

    if (filters?.fieldType) {
      filtered = filtered.filter((r) =>
        r.field_types.includes(filters.fieldType!)
      );
    }

    if (filters?.location) {
      const loc = filters.location.toLowerCase();
      filtered = filtered.filter(
        (r) => r.region?.toLowerCase().includes(loc) ||
               r.profile?.full_name?.toLowerCase().includes(loc)
      );
    }

    return filtered;
  };

  const filteredReferees = getFilteredReferees();

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

        {!loading && referees.length > 0 && (
          <div className="flex items-center gap-3 mb-6">
            <Button onClick={pickRandomReferee} variant="outline" className="gap-2">
              <Shuffle className="h-4 w-4" /> Escolher aleatório
            </Button>
            {randomReferee && (
              <span className="text-sm text-muted-foreground">
                Selecionado: <span className="text-foreground font-medium">{randomReferee.profile?.full_name || "Árbitro"}</span>
              </span>
            )}
          </div>
        )}

        {/* Random referee highlight */}
        {randomReferee && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 rounded-2xl border-2 border-primary/50 bg-primary/5"
          >
            <p className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
              <Shuffle className="h-4 w-4" /> Árbitro selecionado aleatoriamente
            </p>
            <div className="max-w-md">
              <RefereeCard
                refereeId={randomReferee.id}
                name={randomReferee.profile?.full_name || "Árbitro"}
                region={randomReferee.region || "Não informada"}
                rating={randomReferee.avgRating}
                matches={randomReferee.reviewCount}
                price={randomReferee.price_per_match}
                fieldTypes={randomReferee.field_types.map((ft) => FIELD_LABELS[ft] || ft)}
                rawFieldTypes={randomReferee.field_types}
                competitionLevels={randomReferee.competition_levels}
                isVerified={randomReferee.is_verified}
                avatar={getAvatarUrl(randomReferee.profile?.avatar_url, randomReferee.profile?.full_name)}
              />
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <RefereeCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredReferees.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {filters?.region || filters?.fieldType
              ? "Nenhum árbitro encontrado com esses filtros."
              : "Nenhum árbitro cadastrado ainda."}
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReferees.map((ref) => (
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
