import { DOCUMENT } from "@angular/common";
import { inject, Injectable } from "@angular/core";

import type {
  CountryProfileId,
  DetectionMode,
  MaskGroupPreferenceMap,
} from "../masking/declarations/masking.types";
import {
  PROFILE_FILE_NAME_PREFIX,
  PROFILE_VERSION,
} from "./constants/profile-export.constants";
import type { MaskingProfile } from "./declarations/profile-export.types";

export type { MaskingProfile } from "./declarations/profile-export.types";

/**
 * S-006: Export/Import masking profiles for portability and team sharing.
 */
@Injectable({ providedIn: "root" })
export class ProfileExportService {
  readonly #document = inject(DOCUMENT);

  /**
   * Exports current settings to a downloaded JSON file.
   */
  exportProfile(
    name: string,
    detectionMode: DetectionMode,
    selectedCountries: CountryProfileId[],
    groupPreferences: MaskGroupPreferenceMap,
  ): void {
    const profile: MaskingProfile = {
      version: PROFILE_VERSION,
      exportedAt: new Date().toISOString(),
      name,
      settings: {
        detectionMode,
        selectedCountries: [...selectedCountries],
        groupPreferences,
      },
    };

    const json = JSON.stringify(profile, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const anchor = this.#document.createElement("a");
    anchor.href = url;
    anchor.download = `${PROFILE_FILE_NAME_PREFIX}-${this.#sanitizeFileName(name)}.json`;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Imports a profile from a file. Returns parsed profile or throws on validation error.
   */
  async importProfile(file: File): Promise<MaskingProfile> {
    const text = await file.text();
    const json = JSON.parse(text);

    return this.#validateProfile(json);
  }

  /**
   * Opens file picker and returns imported profile.
   */
  async pickAndImport(): Promise<MaskingProfile | null> {
    return new Promise(resolve => {
      const input = this.#document.createElement("input");
      input.type = "file";
      input.accept = ".json,application/json";

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        try {
          const profile = await this.importProfile(file);
          resolve(profile);
        } catch (error) {
          console.error("Profile import failed:", error);
          resolve(null);
        }
      };

      input.click();
    });
  }

  #validateProfile(data: unknown): MaskingProfile {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid profile format: not an object");
    }

    const profile = data as Record<string, unknown>;

    if (profile["version"] !== PROFILE_VERSION) {
      throw new Error(`Unsupported profile version: ${profile["version"]}`);
    }

    if (!profile["settings"] || typeof profile["settings"] !== "object") {
      throw new Error("Invalid profile format: missing settings");
    }

    const settings = profile["settings"] as Record<string, unknown>;

    if (!settings["detectionMode"]) {
      throw new Error("Invalid profile format: missing detectionMode");
    }

    if (!Array.isArray(settings["selectedCountries"])) {
      throw new Error(
        "Invalid profile format: selectedCountries must be an array",
      );
    }

    if (
      !settings["groupPreferences"] ||
      typeof settings["groupPreferences"] !== "object"
    ) {
      throw new Error("Invalid profile format: missing groupPreferences");
    }

    return data as MaskingProfile;
  }

  #sanitizeFileName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 32);
  }
}
