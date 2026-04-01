const LOCATION_REGION_RULES = [
  {
    region: "Zona Norte",
    keywords: ["zona norte", "santana", "tucuruvi", "vila maria", "vila guilherme", "casa verde", "mandaqui", "jaçanã", "jacana", "limão", "limao"],
  },
  {
    region: "Zona Sul",
    keywords: ["zona sul", "santo amaro", "interlagos", "capão redondo", "capao redondo", "morumbi", "campo limpo", "jabaquara", "grajaú", "grajau"],
  },
  {
    region: "Zona Leste",
    keywords: ["zona leste", "itaquera", "são mateus", "sao mateus", "penha", "tatuapé", "tatuape", "mooca", "arthur alvim", "guaianases", "sapopemba"],
  },
  {
    region: "Zona Oeste",
    keywords: ["zona oeste", "pinheiros", "butantã", "butanta", "lapa", "perdizes", "barra funda", "jaguaré", "jaguare", "pirituba"],
  },
  {
    region: "Centro",
    keywords: ["centro", "república", "republica", "sé", "se", "liberdade", "bela vista", "consolação", "consolacao", "higienópolis", "higienopolis"],
  },
  {
    region: "ABC Paulista",
    keywords: ["santo andré", "santo andre", "são bernardo do campo", "sao bernardo do campo", "são caetano do sul", "sao caetano do sul", "diadema", "mauá", "maua", "ribeirão pires", "ribeirao pires", "rio grande da serra"],
  },
  {
    region: "Guarulhos",
    keywords: ["guarulhos"],
  },
  {
    region: "Osasco",
    keywords: ["osasco"],
  },
  {
    region: "São Paulo",
    keywords: ["são paulo", "sao paulo"],
  },
] as const;

const COMMON_LOCATION_WORDS = new Set([
  "rua",
  "avenida",
  "av",
  "estrada",
  "travessa",
  "alameda",
  "rodovia",
  "quadra",
  "campo",
  "arena",
  "estadio",
  "estádio",
  "numero",
  "número",
  "bairro",
  "cidade",
  "jardim",
  "vila",
  "dos",
  "das",
  "de",
  "do",
  "da",
  "e",
  "brasil",
]);

export const normalizeLocationText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9,\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const inferRegionFromLocation = (location: string) => {
  const normalizedLocation = normalizeLocationText(location);

  if (!normalizedLocation) return undefined;

  return LOCATION_REGION_RULES.find(({ keywords }) =>
    keywords.some((keyword) => normalizedLocation.includes(normalizeLocationText(keyword)))
  )?.region;
};

export const matchesLocationQuery = (
  query: string,
  region?: string | null,
  fullName?: string | null,
) => {
  const normalizedQuery = normalizeLocationText(query);

  if (!normalizedQuery) return true;

  const normalizedRegion = normalizeLocationText(region || "");
  const normalizedFullName = normalizeLocationText(fullName || "");

  if (
    (normalizedRegion && (normalizedRegion.includes(normalizedQuery) || normalizedQuery.includes(normalizedRegion))) ||
    (normalizedFullName && normalizedFullName.includes(normalizedQuery))
  ) {
    return true;
  }

  const inferredRegion = inferRegionFromLocation(query);
  const normalizedInferredRegion = inferredRegion ? normalizeLocationText(inferredRegion) : "";

  if (
    normalizedInferredRegion &&
    normalizedRegion &&
    (normalizedRegion.includes(normalizedInferredRegion) || normalizedInferredRegion.includes(normalizedRegion))
  ) {
    return true;
  }

  const commaSeparatedParts = normalizedQuery
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length >= 3);

  if (
    commaSeparatedParts.some(
      (part) =>
        (normalizedRegion && normalizedRegion.includes(part)) ||
        (normalizedFullName && normalizedFullName.includes(part)),
    )
  ) {
    return true;
  }

  const significantWords = normalizedQuery
    .split(" ")
    .filter((word) => word.length >= 4 && !COMMON_LOCATION_WORDS.has(word));

  return significantWords.some(
    (word) =>
      (normalizedRegion && normalizedRegion.includes(word)) ||
      (normalizedFullName && normalizedFullName.includes(word)),
  );
};