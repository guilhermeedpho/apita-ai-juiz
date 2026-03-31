import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const userIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "user-marker-icon",
});

const refereeIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Known region coordinates (São Paulo)
const REGION_COORDS: Record<string, [number, number]> = {
  "zona norte": [-23.4800, -46.6400],
  "zona sul": [-23.6500, -46.6600],
  "zona leste": [-23.5400, -46.4700],
  "zona oeste": [-23.5300, -46.7500],
  "centro": [-23.5505, -46.6340],
  "abc paulista": [-23.6600, -46.5400],
  "guarulhos": [-23.4600, -46.5300],
  "osasco": [-23.5300, -46.7900],
  "são paulo": [-23.5505, -46.6340],
  "sao paulo": [-23.5505, -46.6340],
  "sao paulo zona leste": [-23.5400, -46.4700],
  "são paulo zona leste": [-23.5400, -46.4700],
};

function getRegionCoords(region: string | null): [number, number] | null {
  if (!region) return null;
  const lower = region.toLowerCase().trim();
  
  // Direct match
  if (REGION_COORDS[lower]) return REGION_COORDS[lower];
  
  // Partial match
  for (const [key, coords] of Object.entries(REGION_COORDS)) {
    if (lower.includes(key) || key.includes(lower)) return coords;
  }
  
  return null;
}

interface RefereeMapData {
  id: string;
  name: string;
  region: string | null;
  coords: [number, number];
  fieldTypes: string[];
  price: number;
  isVerified: boolean;
}

const FlyToUser = ({ coords }: { coords: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 13, { duration: 1.5 });
    }
  }, [coords, map]);
  return null;
};

const FIELD_LABELS: Record<string, string> = {
  society: "Society",
  campo: "Campo",
  futsal: "Futsal",
  areia: "Areia",
};

const RefereeMap = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [referees, setReferees] = useState<RefereeMapData[]>([]);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    const fetchReferees = async () => {
      const { data: refereesData } = await supabase.from("referees").select("id, user_id, region, field_types, price_per_match, is_verified");
      if (!refereesData) return;

      const userIds = refereesData.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

      const mapped: RefereeMapData[] = refereesData
        .map((r) => {
          const coords = getRegionCoords(r.region);
          if (!coords) return null;
          // Add small random offset so markers don't stack
          const jitter: [number, number] = [
            coords[0] + (Math.random() - 0.5) * 0.01,
            coords[1] + (Math.random() - 0.5) * 0.01,
          ];
          return {
            id: r.id,
            name: profileMap.get(r.user_id) || "Árbitro",
            region: r.region,
            coords: jitter,
            fieldTypes: r.field_types,
            price: r.price_per_match,
            isVerified: r.is_verified,
          };
        })
        .filter(Boolean) as RefereeMapData[];

      setReferees(mapped);
    };

    fetchReferees();
  }, []);

  const handleLocate = () => {
    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      (err) => {
        setLocationError("Não foi possível obter sua localização. Verifique as permissões do navegador.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const defaultCenter: [number, number] = userLocation || [-23.5505, -46.6340]; // São Paulo center

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-card rounded-2xl p-4 md:p-6 shadow-card border border-border">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-xl font-display flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              MAPA DE ÁRBITROS
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleLocate}
              disabled={locating}
            >
              <Navigation className="h-4 w-4" />
              {locating ? "Localizando..." : "Minha localização"}
            </Button>
          </div>

          {locationError && (
            <p className="text-xs text-destructive mb-2">{locationError}</p>
          )}

          <div className="rounded-xl overflow-hidden border border-border" style={{ height: "350px" }}>
            <MapContainer
              center={defaultCenter}
              zoom={11}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FlyToUser coords={userLocation} />

              {userLocation && (
                <Marker position={userLocation} icon={userIcon}>
                  <Popup>
                    <strong>📍 Você está aqui</strong>
                  </Popup>
                </Marker>
              )}

              {referees.map((ref) => (
                <Marker key={ref.id} position={ref.coords} icon={refereeIcon}>
                  <Popup>
                    <div className="text-sm space-y-1">
                      <strong>{ref.name}</strong>
                      {ref.isVerified && <span className="ml-1">✅</span>}
                      <br />
                      <span className="text-xs text-gray-600">
                        {ref.fieldTypes.map((ft) => FIELD_LABELS[ft] || ft).join(", ")}
                      </span>
                      <br />
                      <span className="text-xs font-medium">R$ {ref.price}/partida</span>
                      {ref.region && (
                        <>
                          <br />
                          <span className="text-xs text-gray-500">📍 {ref.region}</span>
                        </>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <p className="text-[11px] text-muted-foreground mt-2 text-center">
            🟢 Árbitros disponíveis • 🔵 Sua localização
          </p>
        </div>
      </div>
    </section>
  );
};

export default RefereeMap;
