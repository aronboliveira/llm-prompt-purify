import {
  detectBrowserCountryProfileIds,
  matchBrowserLocaleToCountryProfileId,
} from "./country-profile-defaults.utils";

describe("country-profile-defaults utils", () => {
  it("maps explicit browser locales to the most relevant country profile", () => {
    expect(matchBrowserLocaleToCountryProfileId("pt-BR")).toBe("br");
    expect(matchBrowserLocaleToCountryProfileId("pt-PT")).toBe("pt");
    expect(matchBrowserLocaleToCountryProfileId("es-ES")).toBe("es");
    expect(matchBrowserLocaleToCountryProfileId("es-419")).toBe("latam-es");
    expect(matchBrowserLocaleToCountryProfileId("zh-CN")).toBe("cn");
    expect(matchBrowserLocaleToCountryProfileId("ru-RU")).toBe("ru");
    expect(matchBrowserLocaleToCountryProfileId("en-IN")).toBe("in");
  });

  it("uses the first supported browser locale and falls back to Brazil when nothing matches", () => {
    expect(detectBrowserCountryProfileIds(["ru-RU", "en-US"])).toEqual(["ru"]);
    expect(detectBrowserCountryProfileIds(["xx-YY"])).toEqual(["br"]);
  });
});
