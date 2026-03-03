import type { CountryProfileId } from "../../masking/declarations/masking.types";

interface BrowserLocaleMapping {
  countryProfileId: CountryProfileId;
  pattern: RegExp;
}

export const BROWSER_LOCALE_MAPPINGS: readonly BrowserLocaleMapping[] = Object.freeze([
  { countryProfileId: "br", pattern: /^pt-br$/iu },
  { countryProfileId: "pt", pattern: /^pt(?:-pt)?$/iu },
  { countryProfileId: "us", pattern: /^en-us$/iu },
  { countryProfileId: "in", pattern: /^(?:en|hi|bn|gu|kn|ml|mr|pa|ta|te)-in$/iu },
  { countryProfileId: "es", pattern: /^es-es$/iu },
  { countryProfileId: "mx", pattern: /^es-mx$/iu },
  { countryProfileId: "ar", pattern: /^es-ar$/iu },
  { countryProfileId: "cl", pattern: /^es-cl$/iu },
  { countryProfileId: "co", pattern: /^es-co$/iu },
  { countryProfileId: "pe", pattern: /^es-pe$/iu },
  {
    countryProfileId: "latam-es",
    pattern:
      /^es-(?:419|bo|cr|cu|do|ec|gt|hn|ni|pa|pr|py|sv|uy|ve)$/iu,
  },
  { countryProfileId: "cn", pattern: /^zh(?:-(?:cn|hans))?$/iu },
  { countryProfileId: "ru", pattern: /^ru(?:-ru)?$/iu },
]);
