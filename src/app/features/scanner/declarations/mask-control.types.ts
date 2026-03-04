import type {
  MaskGroupSummary,
  ScanMatch,
} from "@core/masking/declarations/masking.types";

export type StatusTone = "error" | "info" | "success";

export interface MaskControlSection {
  group: MaskGroupSummary;
  matches: readonly ScanMatch[];
}
