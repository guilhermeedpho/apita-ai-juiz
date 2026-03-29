import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, ShieldCheck, Trophy } from "lucide-react";
import ReviewDialog from "./ReviewDialog";
import BookingDialog from "./BookingDialog";

interface RefereeCardProps {
  name: string;
  region: string;
  rating: number;
  matches: number;
  price: number;
  fieldTypes: string[];
  rawFieldTypes?: string[];
  competitionLevels?: string[];
  avatar: string;
  refereeId?: string;
  isVerified?: boolean;
}

const LEVEL_LABELS: Record<string, string> = {
  pelada: "Pelada",
  competitivo: "Competitivo",
  profissional: "Profissional",
};

const StarRating = ({ rating, count }: { rating: number; count: number }) => {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${
              star <= Math.round(rating)
                ? "fill-accent text-accent"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
      <span className="font-semibold text-sm text-accent">{rating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({count})</span>
    </div>
  );
};

const RefereeCard = ({
  name,
  region,
  rating,
  matches,
  price,
  fieldTypes,
  rawFieldTypes = [],
  competitionLevels = [],
  avatar,
  refereeId,
  isVerified,
}: RefereeCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      className="bg-gradient-card rounded-2xl border border-border shadow-card overflow-hidden group"
    >
      <div className="p-6">
        <div className="flex items-start gap-4 mb-3">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-secondary overflow-hidden flex-shrink-0 ring-1 ring-border">
            <img src={avatar} alt={name} className="w-full h-full object-cover object-center" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-display text-xl truncate">{name}</h3>
              {isVerified && (
                <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{region}</span>
            </div>
            <StarRating rating={rating} count={matches} />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {fieldTypes.map((ft) => (
            <Badge key={ft} variant="secondary" className="text-xs font-medium">
              {ft}
            </Badge>
          ))}
        </div>

        {competitionLevels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {competitionLevels.map((level) => (
              <span
                key={level}
                className="text-xs px-2 py-1 rounded-md bg-accent/15 text-accent font-medium flex items-center gap-1"
              >
                <Trophy className="h-3 w-3" />
                {LEVEL_LABELS[level] || level}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <Clock className="h-3.5 w-3.5" />
          <span>{matches} {matches === 1 ? "avaliação" : "avaliações"}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-display text-gradient-primary">
              R${price}
            </span>
            <span className="text-sm text-muted-foreground">/partida</span>
          </div>
          <div className="flex items-center gap-2">
            {refereeId && (
              <ReviewDialog refereeId={refereeId} refereeName={name} />
            )}
            {refereeId && rawFieldTypes.length > 0 && (
              <BookingDialog
                refereeId={refereeId}
                refereeName={name}
                availableFieldTypes={rawFieldTypes}
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RefereeCard;
