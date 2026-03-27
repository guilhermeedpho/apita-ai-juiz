import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Search, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-referee.jpg";

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Árbitro de futebol"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <div className="container relative z-10 mx-auto px-4 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-display leading-[0.9] tracking-tight mb-6">
            <span className="text-foreground">SEU JUIZ</span>
            <br />
            <span className="text-gradient-primary">NA HORA CERTA</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 font-body">
            Encontre e agende árbitros profissionais para sua pelada, rachão ou
            campeonato. Society, campo ou quadra — com pagamento via PIX, débito
            ou crédito.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="default" size="lg" className="text-lg px-8 py-6 font-semibold">
              <Search className="mr-2 h-5 w-5" />
              Encontrar Árbitro
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 font-semibold border-border hover:bg-secondary" onClick={() => navigate("/auth")}>
              <ShieldCheck className="mr-2 h-5 w-5" />
              Quero Ser Árbitro
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 grid grid-cols-3 gap-8 max-w-lg"
        >
          {[
            { value: "500+", label: "Árbitros" },
            { value: "12k+", label: "Partidas" },
            { value: "4.8★", label: "Avaliação" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl md:text-4xl font-display text-gradient-primary">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
