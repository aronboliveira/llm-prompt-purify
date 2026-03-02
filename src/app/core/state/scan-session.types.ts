import type { ScanResult } from "../masking/masking.types";

export interface ScanSessionState {
  errorMessage: string | null;
  isScanning: boolean;
  result: ScanResult | null;
  sourceText: string;
}
