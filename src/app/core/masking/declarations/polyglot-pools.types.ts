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

export type AlphabeticSubtype = "armenian" | "cyrillic" | "georgian" | "latin";

export type SyllabarySubtype = "ethiopic" | "hangul" | "hiragana" | "katakana";

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

export interface CharacterPool {
  readonly family: WritingSystemFamily;
  readonly subtype: WritingSystemSubtype;
  readonly label: string;
  readonly chars: string;
}
