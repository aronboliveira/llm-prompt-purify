import type {
  MaskGroupSummary,
  ScanMatch,
} from "../../../core/masking/declarations/masking.types";
import type { MaskControlSection } from "../declarations/mask-control.types";

export function buildMaskControlSections(
  groups: readonly MaskGroupSummary[],
  matches: readonly ScanMatch[]
): readonly MaskControlSection[] {
  return groups.map(group => {
    const groupMatches = matches
      .filter(match => match.groupId === group.id)
      .sort((left, right) => {
        if (left.enabled !== right.enabled) return left.enabled ? -1 : 1;
        return left.label.localeCompare(right.label);
      });

    return {
      group,
      matches: groupMatches,
    };
  });
}

export function formatMaskControlValue(match: ScanMatch): string {
  return `${match.label} (${match.mask}): ${match.value}`;
}
