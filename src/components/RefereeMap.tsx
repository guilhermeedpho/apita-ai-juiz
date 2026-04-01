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

// Known region coordinates (Brazil)
const REGION_COORDS: Record<string, [number, number]> = {
  // SP Capital
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
  // Capitais / Estados
  "rio de janeiro": [-22.9068, -43.1729],
  "minas gerais": [-19.9167, -43.9345],
  "belo horizonte": [-19.9167, -43.9345],
  "bahia": [-12.9714, -38.5124],
  "salvador": [-12.9714, -38.5124],
  "paraná": [-25.4284, -49.2733],
  "curitiba": [-25.4284, -49.2733],
  "rio grande do sul": [-30.0346, -51.2177],
  "porto alegre": [-30.0346, -51.2177],
  "pernambuco": [-8.0476, -34.8770],
  "recife": [-8.0476, -34.8770],
  "ceará": [-3.7172, -38.5433],
  "fortaleza": [-3.7172, -38.5433],
  "pará": [-1.4558, -48.5024],
  "belém": [-1.4558, -48.5024],
  "santa catarina": [-27.5954, -48.5480],
  "florianópolis": [-27.5954, -48.5480],
  "goiás": [-16.6869, -49.2648],
  "goiânia": [-16.6869, -49.2648],
  "distrito federal": [-15.7975, -47.8919],
  "brasília": [-15.7975, -47.8919],
  "maranhão": [-2.5307, -44.2825],
  "são luís": [-2.5307, -44.2825],
  "amazonas": [-3.1190, -60.0217],
  "manaus": [-3.1190, -60.0217],
  "espírito santo": [-20.3155, -40.3128],
  "vitória": [-20.3155, -40.3128],
  "paraíba": [-7.1195, -34.8450],
  "joão pessoa": [-7.1195, -34.8450],
  "mato grosso do sul": [-20.4697, -54.6201],
  "campo grande": [-20.4697, -54.6201],
  "mato grosso": [-15.6014, -56.0979],
  "cuiabá": [-15.6014, -56.0979],
  "rio grande do norte": [-5.7945, -35.2110],
  "natal": [-5.7945, -35.2110],
  "alagoas": [-9.6658, -35.7353],
  "maceió": [-9.6658, -35.7353],
  "piauí": [-5.0892, -42.8019],
  "teresina": [-5.0892, -42.8019],
  "sergipe": [-10.9091, -37.0677],
  "aracaju": [-10.9091, -37.0677],
  "rondônia": [-8.7612, -63.9004],
  "porto velho": [-8.7612, -63.9004],
  "tocantins": [-10.1753, -48.2982],
  "palmas": [-10.1753, -48.2982],
  "acre": [-9.9754, -67.8249],
  "rio branco": [-9.9754, -67.8249],
  "amapá": [0.0349, -51.0694],
  "macapá": [0.0349, -51.0694],
  "roraima": [2.8195, -60.6714],
  "boa vista": [2.8195, -60.6714],
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

  const defaultCenter: [number, number] = userLocation || [-14.2350, -51.9253]; // Brazil center

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
