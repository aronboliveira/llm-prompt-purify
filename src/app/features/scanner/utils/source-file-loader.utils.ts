import { ContentPurifier } from "@core/purification/purification.service";
import type { ThreatType } from "@core/purification/declarations/purification.types";
import {
  ENV_FILENAME_RE,
  SOURCE_FILE_ALLOWED_EXTENSIONS,
  SOURCE_FILE_ALLOWED_MIME_TYPES,
  SOURCE_FILE_MAX_BYTES,
} from "@features/scanner/constants/source-input.constants";

export type SourceFileLoadError =
  | "extension"
  | "mime"
  | "size"
  | "empty"
  | "binary"
  | "read";

export interface SourceFileLoadFailure {
  readonly ok: false;
  readonly reason: SourceFileLoadError;
  readonly message: string;
}

export interface SourceFileLoadSuccess {
  readonly ok: true;
  readonly fileName: string;
  readonly text: string;
  readonly threatCount: number;
  readonly threatTypes: readonly ThreatType[];
}

export type SourceFileLoadResult = SourceFileLoadFailure | SourceFileLoadSuccess;

const PURIFIER = new ContentPurifier({
  detectXss: true,
  detectXxe: true,
  detectSqlInjection: false,
  detectPathTraversal: false,
  stripThreats: true,
  encodeHtml: false,
});

const BINARY_BYTE_THRESHOLD = 0.02;

function hasAllowedExtension(name: string): boolean {
  if (ENV_FILENAME_RE.test(name)) return true;
  const lower = name.toLowerCase();
  return SOURCE_FILE_ALLOWED_EXTENSIONS.some(ext => lower.endsWith(ext));
}

function hasAllowedMime(type: string): boolean {
  return SOURCE_FILE_ALLOWED_MIME_TYPES.includes(type);
}

function looksBinary(text: string): boolean {
  if (text.length === 0) return false;
  let nonPrintable = 0;
  const sampleSize = Math.min(text.length, 4096);
  for (let i = 0; i < sampleSize; i++) {
    const code = text.charCodeAt(i);
    if (code === 0) return true;
    if (code < 9 || (code > 13 && code < 32)) nonPrintable++;
  }
  return nonPrintable / sampleSize > BINARY_BYTE_THRESHOLD;
}

export async function loadSourceFile(file: File): Promise<SourceFileLoadResult> {
  if (!hasAllowedExtension(file.name)) {
    return {
      ok: false,
      reason: "extension",
      message: "Only .txt and .log files are accepted.",
    };
  }

  if (!hasAllowedMime(file.type)) {
    return {
      ok: false,
      reason: "mime",
      message: `File type "${file.type}" is not a plain-text type.`,
    };
  }

  if (file.size > SOURCE_FILE_MAX_BYTES) {
    const limitKb = Math.round(SOURCE_FILE_MAX_BYTES / 1024);
    return {
      ok: false,
      reason: "size",
      message: `File is larger than ${limitKb} KB. Trim it before loading.`,
    };
  }

  if (file.size === 0) {
    return {
      ok: false,
      reason: "empty",
      message: "File is empty.",
    };
  }

  let raw: string;
  try {
    raw = await file.text();
  } catch {
    return {
      ok: false,
      reason: "read",
      message: "Could not read the file. It may be corrupt or locked.",
    };
  }

  if (looksBinary(raw)) {
    return {
      ok: false,
      reason: "binary",
      message: "File appears to contain binary data and was rejected.",
    };
  }

  const result = PURIFIER.purify(raw);
  const threatTypes = Array.from(
    new Set(result.threats.map(t => t.type)),
  ) as ThreatType[];

  return {
    ok: true,
    fileName: file.name,
    text: result.purifiedText,
    threatCount: result.threats.length,
    threatTypes,
  };
}
