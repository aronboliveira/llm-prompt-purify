/**
 * Unit tests for mask-group utility function: createGroupPreferenceMap.
 */
import { createGroupPreferenceMap } from "../utils/mask-group.utils";
import { DEFAULT_GROUP_PREFERENCES, MASK_GROUP_ORDER } from "../constants/masking.constants";

describe("createGroupPreferenceMap", () => {
  it("returns defaults when called with no overrides", () => {
    const map = createGroupPreferenceMap();

    for (const groupId of MASK_GROUP_ORDER) {
      expect(map[groupId].enabled).toBe(DEFAULT_GROUP_PREFERENCES[groupId].enabled);
      expect(map[groupId].alwaysOn).toBe(DEFAULT_GROUP_PREFERENCES[groupId].alwaysOn);
    }
  });

  it("applies overrides for specific groups", () => {
    const map = createGroupPreferenceMap({
      financial: { enabled: false },
    });

    expect(map.financial.enabled).toBe(false);
    expect(map.financial.alwaysOn).toBe(false); // default preserved
    expect(map.identifier.enabled).toBe(true);  // unchanged
  });

  it("applies partial overrides (just alwaysOn)", () => {
    const map = createGroupPreferenceMap({
      personal: { alwaysOn: true },
    });

    expect(map.personal.alwaysOn).toBe(true);
    expect(map.personal.enabled).toBe(true); // original default
  });

  it("returns frozen object", () => {
    const map = createGroupPreferenceMap();
    expect(Object.isFrozen(map)).toBe(true);
  });

  it("includes all five mask groups", () => {
    const map = createGroupPreferenceMap();
    const keys = Object.keys(map);

    expect(keys).toContain("credential");
    expect(keys).toContain("financial");
    expect(keys).toContain("identifier");
    expect(keys).toContain("location");
    expect(keys).toContain("personal");
  });

  it("credential defaults to alwaysOn: true", () => {
    const map = createGroupPreferenceMap();
    expect(map.credential.alwaysOn).toBe(true);
    expect(map.credential.enabled).toBe(true);
  });
});
