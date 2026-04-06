/**
 * Comprehensive multilingual address keyword dictionaries.
 *
 * Used by the fuzzy address detection system to identify street types,
 * complements, and location indicators — even when misspelled or
 * separator-stuffed (e.g. "trave--sa" → "travessa").
 *
 * Keywords are stored in their canonical lower-case form WITH diacritics.
 * Matching functions in mask-validation.utils.ts strip diacritics before
 * comparison so that "praca" matches "praça" and "jiron" matches "jirón".
 */

// ─── Portuguese (BR + PT) ──────────────────────────────────────────────────

export const PT_STREET_KEYWORDS: readonly string[] = Object.freeze([
  // Common
  "rua",
  "avenida",
  "travessa",
  "estrada",
  "rodovia",
  "alameda",
  "praça",
  "largo",
  "via",
  // Less common
  "logradouro",
  "viaduto",
  "beco",
  "viela",
  "passagem",
  "servidão",
  "acesso",
  "marginal",
  "retorno",
  "quadra",
  "rotatória",
  "calçadão",
  "ladeira",
  "morro",
  "escadaria",
  "túnel",
  "ponte",
  "passarela",
  "elevado",
  "anel",
  "contorno",
  "trevo",
  "caminho",
  "picada",
  "ramal",
  "variante",
  "paralela",
  "vereda",
  "subida",
  "descida",
  "rampa",
  "balão",
  "entroncamento",
  "desvio",
  "trincheira",
  "córrego",
  "ribeirão",
]);

export const PT_COMPLEMENT_KEYWORDS: readonly string[] = Object.freeze([
  "apartamento",
  "apto",
  "bloco",
  "sala",
  "conjunto",
  "conj",
  "lote",
  "casa",
  "andar",
  "cobertura",
  "fundos",
  "frente",
  "sobreloja",
  "mezanino",
  "galpão",
  "barracão",
  "edifício",
  "torre",
  "ala",
  "pavilhão",
]);

export const PT_PLACE_KEYWORDS: readonly string[] = Object.freeze([
  "bairro",
  "centro",
  "setor",
  "condomínio",
  "residencial",
  "parque",
  "jardim",
  "vila",
  "chácara",
  "fazenda",
  "sítio",
  "gleba",
]);

// ─── Spanish ───────────────────────────────────────────────────────────────

export const ES_STREET_KEYWORDS: readonly string[] = Object.freeze([
  // Common
  "calle",
  "avenida",
  "carrera",
  "boulevard",
  "paseo",
  "vía",
  "camino",
  "colonia",
  // Less common
  "callejón",
  "pasaje",
  "sendero",
  "vereda",
  "glorieta",
  "rotonda",
  "autopista",
  "autovía",
  "ronda",
  "travesía",
  "costanera",
  "malecón",
  "alameda",
  "explanada",
  "plazuela",
  "plazoleta",
  "jirón",
  "prolongación",
  "diagonal",
  "transversal",
  "senda",
  "calzada",
  "circunvalación",
  "retorno",
  "cerrada",
  "privada",
  "andador",
  "circuito",
  "periférico",
  "libramiento",
]);

export const ES_COMPLEMENT_KEYWORDS: readonly string[] = Object.freeze([
  "piso",
  "depto",
  "departamento",
  "local",
  "oficina",
  "suite",
  "interior",
  "lote",
  "casa",
  "manzana",
  "parcela",
  "urbanización",
  "barrio",
  "fraccionamiento",
]);

// ─── English ───────────────────────────────────────────────────────────────

export const EN_STREET_KEYWORDS: readonly string[] = Object.freeze([
  // Common
  "street",
  "avenue",
  "boulevard",
  "drive",
  "road",
  "lane",
  "court",
  "place",
  "way",
  "circle",
  "terrace",
  "trail",
  "parkway",
  // Less common
  "highway",
  "alley",
  "path",
  "walk",
  "row",
  "crescent",
  "close",
  "mews",
  "gardens",
  "grove",
  "heath",
  "rise",
  "vale",
  "dell",
  "croft",
  "square",
  "plaza",
  "promenade",
  "esplanade",
  "bypass",
  "overpass",
  "underpass",
  "pike",
  "turnpike",
  "crossing",
  "point",
  "bend",
  "cove",
  "landing",
  "trace",
  "ridge",
  "knoll",
  "meadow",
  "hollow",
]);

export const EN_COMPLEMENT_KEYWORDS: readonly string[] = Object.freeze([
  "apartment",
  "suite",
  "unit",
  "floor",
  "room",
  "building",
  "tower",
  "wing",
]);

// ─── Aggregated ────────────────────────────────────────────────────────────

/** All address keywords from every language (street + complement + place). */
export const ALL_ADDRESS_KEYWORDS: readonly string[] = Object.freeze([
  ...PT_STREET_KEYWORDS,
  ...PT_COMPLEMENT_KEYWORDS,
  ...PT_PLACE_KEYWORDS,
  ...ES_STREET_KEYWORDS,
  ...ES_COMPLEMENT_KEYWORDS,
  ...EN_STREET_KEYWORDS,
  ...EN_COMPLEMENT_KEYWORDS,
]);

/** Only street-type keywords (used by standalone fuzzy address detection). */
export const ALL_STREET_KEYWORDS: readonly string[] = Object.freeze([
  ...PT_STREET_KEYWORDS,
  ...ES_STREET_KEYWORDS,
  ...EN_STREET_KEYWORDS,
]);
