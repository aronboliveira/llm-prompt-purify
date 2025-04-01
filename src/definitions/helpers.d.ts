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
