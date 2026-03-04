/**
 * Type declarations for browser locale mapping
 */
import type { CountryProfileId } from "../../masking/declarations/masking.types";

export interface BrowserLocaleMapping {
  countryProfileId: CountryProfileId;
  pattern: RegExp;
}
