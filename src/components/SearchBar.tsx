import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComp } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const regions = [
  "Zona Norte", "Zona Sul", "Zona Leste", "Zona Oeste", "Centro",
  "ABC Paulista", "Guarulhos", "Osasco",
];

const fieldTypes = [
  { value: "society", label: "Society" },
  { value: "profissional", label: "Campo Profissional" },
  { value: "quadra", label: "Quadra" },
];

const SearchBar = () => {
  const [date, setDate] = useState<Date>();

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-card rounded-2xl p-6 md:p-8 shadow-card border border-border">
          <h3 className="text-2xl font-display mb-6 text-gradient-primary">ENCONTRE SEU ÁRBITRO</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <Select>
              <SelectTrigger className="h-12 bg-secondary border-border">
                <SelectValue placeholder="Região" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="h-12 bg-secondary border-border">
                <SelectValue placeholder="Tipo de Campo" />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-12 justify-start text-left font-normal bg-secondary border-border",
                    !date && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComp
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Button className="h-12 text-base font-semibold">
              Buscar
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchBar;
