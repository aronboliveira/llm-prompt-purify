import { MaskingEngine } from "../masking/masking.engine";
import { buildScanScopeSelection } from "../masking/utils/country-scope.utils";
import type {
  ScanWorkerRequest,
  ScanWorkerResponse,
} from "./declarations/scan-engine.types";

const engine = new MaskingEngine();

addEventListener("message", ({ data }: MessageEvent<ScanWorkerRequest>) => {
  try {
    const { id, params, scannedAt } = data,
      result = engine.scan(
        params.sourceText,
        params.groupPreferences,
        buildScanScopeSelection(params.countryProfileIds, params.detectionMode),
        scannedAt,
        params.advancedPreferences,
      ),
      response: ScanWorkerResponse = { id, result };

    postMessage(response);
  } catch (error) {
    const response: ScanWorkerResponse = {
      error: error instanceof Error ? error.message : String(error),
      id: data.id,
    };
    postMessage(response);
  }
});
