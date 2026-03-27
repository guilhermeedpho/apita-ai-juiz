import { motion } from "framer-motion";
import { Search, CalendarCheck, CreditCard, Trophy } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "BUSQUE",
    description: "Escolha região, tipo de campo e data da partida",
  },
  {
    icon: CalendarCheck,
    title: "AGENDE",
    description: "Selecione o árbitro disponível e confirme o horário",
  },
  {
    icon: CreditCard,
    title: "PAGUE",
    description: "PIX, débito ou crédito — pagamento rápido e seguro",
  },
  {
    icon: Trophy,
    title: "JOGUE",
    description: "Árbitro confirmado na sua pelada. É só aproveitar!",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-gradient-hero">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-5xl md:text-7xl font-display text-center mb-16"
        >
          COMO <span className="text-gradient-primary">FUNCIONA</span>
        </motion.h2>

        <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-secondary flex items-center justify-center group-hover:shadow-glow transition-shadow duration-300">
                <step.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-2xl font-display mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
