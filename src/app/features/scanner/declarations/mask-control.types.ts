import type {
  MaskGroupSummary,
  ScanMatch,
} from "../../../core/masking/declarations/masking.types";

export interface MaskControlSection {
  group: MaskGroupSummary;
  matches: readonly ScanMatch[];
}
