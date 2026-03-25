/**
 * Polyglot Mask Character Pools
 *
 * Unicode character pools organized by writing system family.
 * Each pool draws from a specific script range to produce
 * visually unpredictable masks that can never form real words.
 *
 * IMPORTANT: No logograph systems (CJK ideographs) are included.
 */

// ─── Writing System Taxonomy ─────────────────────────────────────────────────

export type WritingSystemFamily =
  | "abugida"
  | "alphabetic"
  | "syllabary"
  | "symbol";

export type AbugidaSubtype =
  | "bengali"
  | "devanagari"
  | "gujarati"
  | "kannada"
  | "tamil"
  | "telugu"
  | "thai";

export type AlphabeticSubtype =
  | "armenian"
  | "cyrillic"
  | "georgian"
  | "latin";

export type SyllabarySubtype =
  | "ethiopic"
  | "hangul"
  | "hiragana"
  | "katakana";

export type SymbolSubtype =
  | "arrows"
  | "box-drawing"
  | "geometric"
  | "keyboard"
  | "math"
  | "misc";

export type WritingSystemSubtype =
  | AbugidaSubtype
  | AlphabeticSubtype
  | SyllabarySubtype
  | SymbolSubtype;

// ─── Pool Definition ─────────────────────────────────────────────────────────

export interface CharacterPool {
  readonly family: WritingSystemFamily;
  readonly subtype: WritingSystemSubtype;
  readonly label: string;
  readonly chars: string;
}

// ─── Abugidas ────────────────────────────────────────────────────────────────

const DEVANAGARI: CharacterPool = {
  family: "abugida",
  subtype: "devanagari",
  label: "Devanagari",
  chars: "अआइईउऊएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसह",
};

const BENGALI: CharacterPool = {
  family: "abugida",
  subtype: "bengali",
  label: "Bengali",
  chars: "অআইঈউঊএঐওঔকখগঘচছজঝটঠডঢণতথদধনপফবভমযরলশষসহ",
};

const TAMIL: CharacterPool = {
  family: "abugida",
  subtype: "tamil",
  label: "Tamil",
  chars: "அஆஇஈஉஊஎஏஐஒஓஔகஙசஜஞடணதநனபமயரலவழளறன",
};

const TELUGU: CharacterPool = {
  family: "abugida",
  subtype: "telugu",
  label: "Telugu",
  chars: "అఆఇఈఉఊఎఏఐఒఓఔకఖగఘచఛజఝటఠడఢణతథదధనపఫబభమయరలవశషసహ",
};

const GUJARATI: CharacterPool = {
  family: "abugida",
  subtype: "gujarati",
  label: "Gujarati",
  chars: "અઆઇઈઉઊએઐઓઔકખગઘચછજઝટઠડઢણતથદધનપફબભમયરલવશષસહ",
};

const KANNADA: CharacterPool = {
  family: "abugida",
  subtype: "kannada",
  label: "Kannada",
  chars: "ಅಆಇಈಉಊಎಏಐಒಓಔಕಖಗಘಚಛಜಝಟಠಡಢಣತಥದಧನಪಫಬಭಮಯರಲವಶಷಸಹ",
};

const THAI: CharacterPool = {
  family: "abugida",
  subtype: "thai",
  label: "Thai",
  chars: "กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ",
};

// ─── Alphabetics ─────────────────────────────────────────────────────────────

const CYRILLIC: CharacterPool = {
  family: "alphabetic",
  subtype: "cyrillic",
  label: "Cyrillic",
  chars: "БГДЖЗИЙЛПФЦЧШЩЪЫЬЮЯбгджзийлпфцчшщъыьюя",
};

const LATIN: CharacterPool = {
  family: "alphabetic",
  subtype: "latin",
  label: "Extended Latin",
  chars: "ÆÐŁŒŦÞßæðłœŧþƒǝȝȠȤɐɒɔɘɛɜɞɤɥɬɮɰɱɳɵɸʃʄʇʈʊʎʐʑʒʔ",
};

const ARMENIAN: CharacterPool = {
  family: "alphabetic",
  subtype: "armenian",
  label: "Armenian",
  chars: "ԱԲԳԴԵԶԷԸԹԺԻԼԽԾԿՀՁՂՃՄՅՆՇՈՉՊՋՌՍՎՏՐՑՒՓՔՕՖաբգդեզէըթժիլխծկհձղճմյնշոչպջռսվտրցւփքօֆ",
};

const GEORGIAN: CharacterPool = {
  family: "alphabetic",
  subtype: "georgian",
  label: "Georgian",
  chars: "აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ",
};

// ─── Syllabaries ─────────────────────────────────────────────────────────────

const KATAKANA: CharacterPool = {
  family: "syllabary",
  subtype: "katakana",
  label: "Katakana",
  chars: "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン",
};

const HIRAGANA: CharacterPool = {
  family: "syllabary",
  subtype: "hiragana",
  label: "Hiragana",
  chars: "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわん",
};

const HANGUL: CharacterPool = {
  family: "syllabary",
  subtype: "hangul",
  label: "Hangul Jamo",
  chars: "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ",
};

const ETHIOPIC: CharacterPool = {
  family: "syllabary",
  subtype: "ethiopic",
  label: "Ethiopic",
  chars: "ሀሁሂሃሄሆለሉሊላሌሎሐሑሒሓሔሖመሙሚማሜሞረሩሪራሬሮሰሱሲሳሴሶ",
};

// ─── Symbols ─────────────────────────────────────────────────────────────────

const KEYBOARD_SYMBOLS: CharacterPool = {
  family: "symbol",
  subtype: "keyboard",
  label: "Keyboard Symbols",
  chars: "!@#$%^&*~?§±°¢£¥€¤¦©®™",
};

const MATH_SYMBOLS: CharacterPool = {
  family: "symbol",
  subtype: "math",
  label: "Math Symbols",
  chars: "∀∂∃∅∇∈∉∋∏∑∓∗∘√∝∞∟∠∡∢∣∥∧∨∩∪∫≈≠≡≤≥⊂⊃⊆⊇⊕⊗⊥",
};

const ARROWS: CharacterPool = {
  family: "symbol",
  subtype: "arrows",
  label: "Arrows",
  chars: "←↑→↓↔↕↖↗↘↙↞↟↠↡↢↣⇐⇑⇒⇓⇔⇕⇤⇥⤐⤑⤒⤓⤔⤕⤖⤗",
};

const GEOMETRIC: CharacterPool = {
  family: "symbol",
  subtype: "geometric",
  label: "Geometric Shapes",
  chars: "■□▢▣▤▥▦▧▨▩▪▬▮▰▲△▴▵▶▷▸▹►▻▼▽▾▿◀◁◂◃◈◉◊○◌◍◎●◐◑◒◓◔◕",
};

const BOX_DRAWING: CharacterPool = {
  family: "symbol",
  subtype: "box-drawing",
  label: "Box Drawing",
  chars: "─│┌┐└┘├┤┬┴┼╌╍╎╏═║╒╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡╢╣╤╥╦╧╨╩╪╫╬",
};

const MISC_SYMBOLS: CharacterPool = {
  family: "symbol",
  subtype: "misc",
  label: "Miscellaneous",
  chars: "☀☁☂☃☄★☆☉☊☋☌☍☎☏☐☑☒☓☚☛☜☝☞☟☠☡☢☣☤☥☦☧☨☩☪☫☬☭☮☯☰☱☲☳☴☵☶☷",
};

// ─── All Pools by Family ─────────────────────────────────────────────────────

export const ABUGIDA_POOLS: readonly CharacterPool[] = Object.freeze([
  DEVANAGARI,
  BENGALI,
  TAMIL,
  TELUGU,
  GUJARATI,
  KANNADA,
  THAI,
]);

export const ALPHABETIC_POOLS: readonly CharacterPool[] = Object.freeze([
  CYRILLIC,
  LATIN,
  ARMENIAN,
  GEORGIAN,
]);

export const SYLLABARY_POOLS: readonly CharacterPool[] = Object.freeze([
  KATAKANA,
  HIRAGANA,
  HANGUL,
  ETHIOPIC,
]);

export const SYMBOL_POOLS: readonly CharacterPool[] = Object.freeze([
  KEYBOARD_SYMBOLS,
  MATH_SYMBOLS,
  ARROWS,
  GEOMETRIC,
  BOX_DRAWING,
  MISC_SYMBOLS,
]);

export const ALL_POOLS: readonly CharacterPool[] = Object.freeze([
  ...ABUGIDA_POOLS,
  ...ALPHABETIC_POOLS,
  ...SYLLABARY_POOLS,
  ...SYMBOL_POOLS,
]);

export const POOL_BY_SUBTYPE: Readonly<Record<string, CharacterPool>> =
  Object.freeze(
    Object.fromEntries(ALL_POOLS.map(p => [p.subtype, p])),
  );

export const POOLS_BY_FAMILY: Readonly<
  Record<WritingSystemFamily, readonly CharacterPool[]>
> = Object.freeze({
  abugida: ABUGIDA_POOLS,
  alphabetic: ALPHABETIC_POOLS,
  syllabary: SYLLABARY_POOLS,
  symbol: SYMBOL_POOLS,
});

// ─── Default Enabled Configuration ───────────────────────────────────────────

export const DEFAULT_POLYGLOT_FAMILIES: readonly WritingSystemFamily[] =
  Object.freeze(["abugida", "alphabetic", "syllabary", "symbol"]);

export const DEFAULT_POLYGLOT_EXCLUDED_SUBTYPES: readonly WritingSystemSubtype[] =
  Object.freeze([]);

// ─── UI Labels ───────────────────────────────────────────────────────────────

export const WRITING_SYSTEM_FAMILY_LABELS: Readonly<
  Record<WritingSystemFamily, string>
> = Object.freeze({
  abugida: "Abugidas",
  alphabetic: "Alphabetics",
  syllabary: "Syllabaries",
  symbol: "Symbols",
});

export const WRITING_SYSTEM_FAMILY_DESCRIPTIONS: Readonly<
  Record<WritingSystemFamily, string>
> = Object.freeze({
  abugida:
    "Consonant-vowel scripts like Devanagari, Bengali, Tamil, Telugu, Gujarati, Kannada, and Thai.",
  alphabetic:
    "Letter-based scripts: extended Latin, Cyrillic, Armenian, and Georgian.",
  syllabary:
    "Syllable-based scripts: Katakana, Hiragana, Hangul Jamo, and Ethiopic.",
  symbol:
    "Keyboard symbols, mathematical operators, arrows, geometric shapes, box-drawing, and miscellaneous Unicode.",
});

export const WRITING_SYSTEM_FAMILY_ORDER: readonly WritingSystemFamily[] =
  Object.freeze(["symbol", "alphabetic", "syllabary", "abugida"]);
