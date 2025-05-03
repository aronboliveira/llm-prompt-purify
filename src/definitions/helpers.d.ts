declare interface CompressedFile {
  blob: Blob;
  filename: ZipFileName;
}
export type LangCode = "en" | "pt" | "de" | "es" | "jp";
export type LabelKey =
  | "copyOutput"
  | "downloadOutput"
  | "copied"
  | "downloaded";
export interface MaskMatch {
  patternUsed: string;
  startIndex: number;
  endingIndex: number;
  lang: string;
  replacement: string;
  isLabel: boolean;
  excluded: boolean;
  tableRow: number;
  repetitions?: {
    starts: number[];
    endings: number[];
  };
}
export interface resultDict {
  k: string;
  e: RegExp | string;
  v: string;
  foundIn: number;
  endsIn: number;
}
