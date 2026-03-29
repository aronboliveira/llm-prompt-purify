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

import type {
  CharacterPool,
  WritingSystemFamily,
  WritingSystemSubtype,
} from "../declarations/polyglot-pools.types";
import { deepFreeze } from "@shared/utils/deep-freeze.utils";

export type {
  AbugidaSubtype,
  AlphabeticSubtype,
  CharacterPool,
  SyllabarySubtype,
  SymbolSubtype,
  WritingSystemFamily,
  WritingSystemSubtype,
} from "../declarations/polyglot-pools.types";

// ─── Pool Definition ─────────────────────────────────────────────────────────

// ─── Abugidas ────────────────────────────────────────────────────────────────

const DEVANAGARI: CharacterPool = deepFreeze({
  family: "abugida",
  subtype: "devanagari",
  label: "Devanagari",
  chars: "अआइईउऊएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसह",
});

const BENGALI: CharacterPool = deepFreeze({
  family: "abugida",
  subtype: "bengali",
  label: "Bengali",
  chars: "অআইঈউঊএঐওঔকখগঘচছজঝটঠডঢণতথদধনপফবভমযরলশষসহ",
});

const TAMIL: CharacterPool = deepFreeze({
  family: "abugida",
  subtype: "tamil",
  label: "Tamil",
  chars: "அஆஇஈஉஊஎஏஐஒஓஔகஙசஜஞடணதநனபமயரலவழளறன",
});

const TELUGU: CharacterPool = deepFreeze({
  family: "abugida",
  subtype: "telugu",
  label: "Telugu",
  chars: "అఆఇఈఉఊఎఏఐఒఓఔకఖగఘచఛజఝటఠడఢణతథదధనపఫబభమయరలవశషసహ",
});

const GUJARATI: CharacterPool = deepFreeze({
  family: "abugida",
  subtype: "gujarati",
  label: "Gujarati",
  chars: "અઆઇઈઉઊએઐઓઔકખગઘચછજઝટઠડઢણતથદધનપફબભમયરલવશષસહ",
});

const KANNADA: CharacterPool = deepFreeze({
  family: "abugida",
  subtype: "kannada",
  label: "Kannada",
  chars: "ಅಆಇಈಉಊಎಏಐಒಓಔಕಖಗಘಚಛಜಝಟಠಡಢಣತಥದಧನಪಫಬಭಮಯರಲವಶಷಸಹ",
});

const THAI: CharacterPool = deepFreeze({
  family: "abugida",
  subtype: "thai",
  label: "Thai",
  chars: "กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ",
});

// ─── Alphabetics ─────────────────────────────────────────────────────────────

const CYRILLIC: CharacterPool = deepFreeze({
  family: "alphabetic",
  subtype: "cyrillic",
  label: "Cyrillic",
  chars: "БГДЖЗИЙЛПФЦЧШЩЪЫЬЮЯбгджзийлпфцчшщъыьюя",
});

const LATIN: CharacterPool = deepFreeze({
  family: "alphabetic",
  subtype: "latin",
  label: "Extended Latin",
  chars: "ÆÐŁŒŦÞßæðłœŧþƒǝȝȠȤɐɒɔɘɛɜɞɤɥɬɮɰɱɳɵɸʃʄʇʈʊʎʐʑʒʔ",
});

const ARMENIAN: CharacterPool = deepFreeze({
  family: "alphabetic",
  subtype: "armenian",
  label: "Armenian",
  chars:
    "ԱԲԳԴԵԶԷԸԹԺԻԼԽԾԿՀՁՂՃՄՅՆՇՈՉՊՋՌՍՎՏՐՑՒՓՔՕՖաբգդեզէըթժիլխծկհձղճմյնշոչպջռսվտրցւփքօֆ",
});

const GEORGIAN: CharacterPool = deepFreeze({
  family: "alphabetic",
  subtype: "georgian",
  label: "Georgian",
  chars: "აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ",
});

// ─── Syllabaries ─────────────────────────────────────────────────────────────

const KATAKANA: CharacterPool = deepFreeze({
  family: "syllabary",
  subtype: "katakana",
  label: "Katakana",
  chars:
    "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン",
});

const HIRAGANA: CharacterPool = deepFreeze({
  family: "syllabary",
  subtype: "hiragana",
  label: "Hiragana",
  chars:
    "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわん",
});

const HANGUL: CharacterPool = deepFreeze({
  family: "syllabary",
  subtype: "hangul",
  label: "Hangul Jamo",
  chars:
    "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ",
});

const ETHIOPIC: CharacterPool = deepFreeze({
  family: "syllabary",
  subtype: "ethiopic",
  label: "Ethiopic",
  chars: "ሀሁሂሃሄሆለሉሊላሌሎሐሑሒሓሔሖመሙሚማሜሞረሩሪራሬሮሰሱሲሳሴሶ",
});

// ─── Symbols ─────────────────────────────────────────────────────────────────

const KEYBOARD_SYMBOLS: CharacterPool = deepFreeze({
  family: "symbol",
  subtype: "keyboard",
  label: "Keyboard Symbols",
  chars: "!@#$%^&*~?§±°¢£¥€¤¦©®™",
});

const MATH_SYMBOLS: CharacterPool = deepFreeze({
  family: "symbol",
  subtype: "math",
  label: "Math Symbols",
  chars: "∀∂∃∅∇∈∉∋∏∑∓∗∘√∝∞∟∠∡∢∣∥∧∨∩∪∫≈≠≡≤≥⊂⊃⊆⊇⊕⊗⊥",
});

const ARROWS: CharacterPool = deepFreeze({
  family: "symbol",
  subtype: "arrows",
  label: "Arrows",
  chars: "←↑→↓↔↕↖↗↘↙↞↟↠↡↢↣⇐⇑⇒⇓⇔⇕⇤⇥⤐⤑⤒⤓⤔⤕⤖⤗",
});

const GEOMETRIC: CharacterPool = deepFreeze({
  family: "symbol",
  subtype: "geometric",
  label: "Geometric Shapes",
  chars: "■□▢▣▤▥▦▧▨▩▪▬▮▰▲△▴▵▶▷▸▹►▻▼▽▾▿◀◁◂◃◈◉◊○◌◍◎●◐◑◒◓◔◕",
});

const BOX_DRAWING: CharacterPool = deepFreeze({
  family: "symbol",
  subtype: "box-drawing",
  label: "Box Drawing",
  chars: "─│┌┐└┘├┤┬┴┼╌╍╎╏═║╒╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡╢╣╤╥╦╧╨╩╪╫╬",
});

const MISC_SYMBOLS: CharacterPool = deepFreeze({
  family: "symbol",
  subtype: "misc",
  label: "Miscellaneous",
  chars: "☀☁☂☃☄★☆☉☊☋☌☍☎☏☐☑☒☓☚☛☜☝☞☟☠☡☢☣☤☥☦☧☨☩☪☫☬☭☮☯☰☱☲☳☴☵☶☷",
});

// ─── All Pools by Family ─────────────────────────────────────────────────────

export const ABUGIDA_POOLS: readonly CharacterPool[] = deepFreeze([
  DEVANAGARI,
  BENGALI,
  TAMIL,
  TELUGU,
  GUJARATI,
  KANNADA,
  THAI,
]);

export const ALPHABETIC_POOLS: readonly CharacterPool[] = deepFreeze([
  CYRILLIC,
  LATIN,
  ARMENIAN,
  GEORGIAN,
]);

export const SYLLABARY_POOLS: readonly CharacterPool[] = deepFreeze([
  KATAKANA,
  HIRAGANA,
  HANGUL,
  ETHIOPIC,
]);

export const SYMBOL_POOLS: readonly CharacterPool[] = deepFreeze([
  KEYBOARD_SYMBOLS,
  MATH_SYMBOLS,
  ARROWS,
  GEOMETRIC,
  BOX_DRAWING,
  MISC_SYMBOLS,
]);

export const ALL_POOLS: readonly CharacterPool[] = deepFreeze([
  ...ABUGIDA_POOLS,
  ...ALPHABETIC_POOLS,
  ...SYLLABARY_POOLS,
  ...SYMBOL_POOLS,
]);

export const POOL_BY_SUBTYPE: Readonly<Record<string, CharacterPool>> =
  deepFreeze(Object.fromEntries(ALL_POOLS.map(p => [p.subtype, p])));

export const POOLS_BY_FAMILY: Readonly<
  Record<WritingSystemFamily, readonly CharacterPool[]>
> = deepFreeze({
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
