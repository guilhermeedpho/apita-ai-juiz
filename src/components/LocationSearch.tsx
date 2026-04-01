import { useState, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

interface LocationSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const LocationSearch = ({ value, onChange, placeholder = "Buscar local (ex: Arena 90, São Paulo)" }: LocationSearchProps) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchLocation = async (q: string) => {
    if (q.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + " Brasil")}&limit=5&addressdetails=1&countrycodes=br`,
        { headers: { "Accept-Language": "pt-BR" } }
      );
      const data: LocationResult[] = await res.json();
      setResults(data);
      setShowResults(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocation(val), 400);
  };

  const handleSelect = (result: LocationResult) => {
    // Simplify the display name
    const parts = result.display_name.split(",").map((s) => s.trim());
    const short = parts.slice(0, 3).join(", ");
    setQuery(short);
    onChange(short);
    setShowResults(false);
    setResults([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => results.length > 0 && setShowResults(true)}
        className="h-12 bg-secondary border-border pl-10"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
          {results.map((r) => {
            const parts = r.display_name.split(",").map((s) => s.trim());
            const title = parts[0];
            const subtitle = parts.slice(1, 4).join(", ");
            return (
              <button
                key={r.place_id}
                type="button"
                onClick={() => handleSelect(r)}
                className="w-full text-left px-4 py-3 hover:bg-accent/10 transition-colors flex items-start gap-3 border-b border-border/50 last:border-0"
              >
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{title}</p>
                  <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
