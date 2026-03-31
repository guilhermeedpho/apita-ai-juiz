import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComp } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { RefereeFilters } from "./RefereeList";
import LocationSearch from "./LocationSearch";

const regions = [
  "Zona Norte", "Zona Sul", "Zona Leste", "Zona Oeste", "Centro",
  "ABC Paulista", "Guarulhos", "Osasco",
  "Itaquera", "São Mateus", "Penha", "Tatuapé", "Mooca",
  "Santana", "Tucuruvi", "Vila Maria",
  "Santo Amaro", "Interlagos", "Capão Redondo",
  "Pinheiros", "Butantã", "Lapa",
  "São Paulo",
];

const fieldTypes = [
  { value: "society", label: "Society" },
  { value: "campo", label: "Campo (11x11)" },
  { value: "futsal", label: "Futsal" },
  { value: "areia", label: "Futebol de Areia" },
];

interface SearchBarProps {
  onFilter?: (filters: RefereeFilters) => void;
}

const SearchBar = ({ onFilter }: SearchBarProps) => {
  const [date, setDate] = useState<Date>();
  const [region, setRegion] = useState("");
  const [fieldType, setFieldType] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    onFilter?.({
      region: region || undefined,
      fieldType: fieldType || undefined,
      location: location || undefined,
    });
  }, [region, fieldType, location]);

  const handleClear = () => {
    setRegion("");
    setFieldType("");
    setLocation("");
    setDate(undefined);
  };

  const hasFilters = region || fieldType || location;

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-card rounded-2xl p-6 md:p-8 shadow-card border border-border">
          <h3 className="text-2xl font-display mb-6 text-gradient-primary">ENCONTRE SEU ÁRBITRO</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div className="sm:col-span-2 md:col-span-1">
              <LocationSearch
                value={location}
                onChange={setLocation}
                placeholder="Buscar local da quadra"
              />
            </div>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="h-12 bg-secondary border-border">
                <SelectValue placeholder="Região de atuação" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={fieldType} onValueChange={setFieldType}>
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

            <div className="flex gap-2">
              {hasFilters ? (
                <Button variant="outline" className="h-12 flex-1 gap-2" onClick={handleClear}>
                  <X className="h-4 w-4" /> Limpar
                </Button>
              ) : (
                <div className="h-12 flex items-center text-sm text-muted-foreground px-2">
                  <Search className="h-4 w-4 mr-2" /> Filtra automaticamente
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchBar;
