import type { CountryProfileId } from "../../../core/masking/declarations/masking.types";

export function toggleCountrySelection(
  currentCountryProfileIds: readonly CountryProfileId[],
  countryProfileId: CountryProfileId,
  selected: boolean
): readonly CountryProfileId[] {
  const nextSelection = new Set(currentCountryProfileIds);

  if (selected) nextSelection.add(countryProfileId);
  else nextSelection.delete(countryProfileId);

  return Array.from(nextSelection);
}
