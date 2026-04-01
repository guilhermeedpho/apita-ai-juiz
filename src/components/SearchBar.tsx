import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComp } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { inferRegionFromLocation } from "@/lib/location-utils";
import type { RefereeFilters } from "./RefereeList";
import LocationSearch from "./LocationSearch";

const regions = [
  // SP Capital
  "Zona Norte", "Zona Sul", "Zona Leste", "Zona Oeste", "Centro",
  "ABC Paulista", "Guarulhos", "Osasco",
  // Estados / Capitais
  "São Paulo", "Rio de Janeiro", "Minas Gerais", "Bahia",
  "Paraná", "Rio Grande do Sul", "Pernambuco", "Ceará",
  "Pará", "Santa Catarina", "Goiás", "Distrito Federal",
  "Maranhão", "Amazonas", "Espírito Santo", "Paraíba",
  "Mato Grosso do Sul", "Mato Grosso", "Rio Grande do Norte",
  "Alagoas", "Piauí", "Sergipe", "Rondônia", "Tocantins",
  "Acre", "Amapá", "Roraima",
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
  const derivedRegion = region ? undefined : inferRegionFromLocation(location);
  const effectiveRegion = region || derivedRegion || undefined;
  const effectiveLocation = region ? location || undefined : derivedRegion ? undefined : location || undefined;

  useEffect(() => {
    onFilter?.({
      region: effectiveRegion,
      fieldType: fieldType || undefined,
      location: effectiveLocation,
    });
  }, [effectiveLocation, effectiveRegion, fieldType, onFilter]);

  const handleClear = () => {
    setRegion("");
    setFieldType("");
    setLocation("");
    setDate(undefined);
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
  };

  const hasFilters = region || fieldType || location || minPrice || maxPrice || minRating;

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

          {/* Price & Rating Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
            <div className="flex gap-2 items-center">
              <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                type="number"
                placeholder="Preço mín"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="h-10 bg-secondary border-border"
              />
              <span className="text-muted-foreground text-sm">-</span>
              <Input
                type="number"
                placeholder="Preço máx"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="h-10 bg-secondary border-border"
              />
            </div>
            <div className="flex gap-2 items-center">
              <Star className="h-4 w-4 text-accent shrink-0" />
              <Select value={minRating} onValueChange={setMinRating}>
                <SelectTrigger className="h-10 bg-secondary border-border">
                  <SelectValue placeholder="Avaliação mínima" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">⭐ 3+</SelectItem>
                  <SelectItem value="3.5">⭐ 3.5+</SelectItem>
                  <SelectItem value="4">⭐ 4+</SelectItem>
                  <SelectItem value="4.5">⭐ 4.5+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchBar;
