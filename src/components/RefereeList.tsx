import { motion } from "framer-motion";
import RefereeCard from "./RefereeCard";

const mockReferees = [
  {
    name: "Carlos Silva",
    region: "Zona Sul - SP",
    rating: 4.9,
    matches: 342,
    price: 120,
    fieldTypes: ["Society", "Quadra"],
    available: ["Sáb 14h", "Sáb 16h", "Dom 10h"],
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "Roberto Santos",
    region: "Zona Norte - SP",
    rating: 4.7,
    matches: 215,
    price: 100,
    fieldTypes: ["Society", "Campo Profissional"],
    available: ["Sáb 18h", "Dom 08h", "Dom 14h"],
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "André Oliveira",
    region: "ABC Paulista",
    rating: 4.8,
    matches: 189,
    price: 110,
    fieldTypes: ["Quadra", "Society"],
    available: ["Sex 20h", "Sáb 10h", "Sáb 14h"],
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "Marcos Pereira",
    region: "Zona Leste - SP",
    rating: 4.6,
    matches: 156,
    price: 90,
    fieldTypes: ["Campo Profissional", "Society", "Quadra"],
    available: ["Sáb 08h", "Sáb 16h", "Dom 16h"],
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "Felipe Costa",
    region: "Zona Oeste - SP",
    rating: 4.9,
    matches: 278,
    price: 130,
    fieldTypes: ["Society"],
    available: ["Sáb 10h", "Dom 10h", "Dom 16h"],
    avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "Lucas Mendes",
    region: "Guarulhos",
    rating: 4.5,
    matches: 98,
    price: 85,
    fieldTypes: ["Quadra", "Campo Profissional"],
    available: ["Sex 21h", "Sáb 14h", "Dom 08h"],
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop&crop=face",
  },
];

const RefereeList = () => {
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockReferees.map((ref) => (
            <RefereeCard key={ref.name} {...ref} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RefereeList;
