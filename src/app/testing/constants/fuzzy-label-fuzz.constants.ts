import type { FuzzyLabelFuzzSeed } from "../declarations/testing.types";
import {
  buildFuzzyLabelNegativeFixtures,
  buildFuzzyLabelPositiveFixtures,
} from "../utils/fuzzy-label-fuzz.utils";

const FUZZY_LABEL_FUZZ_SEEDS = Object.freeze([
  {
    countryProfileIds: ["us"],
    description: "secret assignment fuzzy labels",
    extraPositiveLabels: ["contrasenia"],
    invalidValue: "admin",
    negativeLabels: ["profile", "preferences"],
    positiveRecipes: Object.freeze([
      {
        description: "transposed characters",
        operations: Object.freeze([{ index: 5, kind: "transpose-chars" }]),
      },
      {
        description: "digit for letter OCR swap",
        operations: Object.freeze([
          { index: 5, kind: "replace-char", value: "0" },
        ]),
      },
      {
        description: "trailing duplicate character",
        operations: Object.freeze([
          { index: 8, kind: "insert-char", value: "d" },
        ]),
      },
      {
        description: "shorthand credential label",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "passwd",
            search: "password",
          },
        ]),
      },
    ]),
    ruleId: "secret-assignment",
    sourceLabel: "password",
    validValue: "Sup3rSecreta#2026",
  },
  {
    countryProfileIds: ["co"],
    description: "Spanish phone fuzzy labels",
    extraPositiveLabels: ["telefone principal"],
    invalidValue: "12345",
    negativeLabels: ["support window", "office line item"],
    positiveRecipes: Object.freeze([
      {
        description: "OCR digit swap",
        operations: Object.freeze([
          { index: 5, kind: "replace-char", value: "0" },
        ]),
      },
      {
        description: "deleted vowel",
        operations: Object.freeze([{ index: 3, kind: "remove-char" }]),
      },
      {
        description: "mistyped suffix",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "princ1pal",
            search: "principal",
          },
        ]),
      },
      {
        description: "cross-language phone noun",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "telephone principal",
            search: "telefono principal",
          },
        ]),
      },
    ]),
    ruleId: "labeled-phone",
    sourceLabel: "telefono principal",
    validValue: "+57 301 222 3344",
  },
  {
    countryProfileIds: ["br"],
    description: "Portuguese name fuzzy labels",
    invalidValue: "ProdutoX",
    negativeLabels: ["produto principal", "release owner"],
    positiveRecipes: Object.freeze([
      {
        description: "OCR digit swap",
        operations: Object.freeze([
          { index: 1, kind: "replace-char", value: "0" },
        ]),
      },
      {
        description: "extra vowel",
        operations: Object.freeze([
          { index: 4, kind: "insert-char", value: "e" },
        ]),
      },
      {
        description: "misspelled surname marker",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "compoleto",
            search: "completo",
          },
        ]),
      },
      {
        description: "character transposition",
        operations: Object.freeze([
          { kind: "replace-substring", replacement: "nomre", search: "nome" },
        ]),
      },
    ]),
    ruleId: "labeled-name",
    sourceLabel: "nome completo",
    validValue: "Maria Clara Souza",
  },
  {
    countryProfileIds: ["co"],
    description: "Spanish address fuzzy labels",
    extraPositiveLabels: ["morada"],
    invalidValue: "roadmap section",
    negativeLabels: ["planning section", "release heading"],
    positiveRecipes: Object.freeze([
      {
        description: "OCR digit in suffix",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "direcc1on",
            search: "direccion",
          },
        ]),
      },
      {
        description: "OCR digit in prefix",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "d1reccion",
            search: "direccion",
          },
        ]),
      },
      {
        description: "double consonant typo",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "dirrecion",
            search: "direccion",
          },
        ]),
      },
      {
        description: "deleted consonant",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "direcion",
            search: "direccion",
          },
        ]),
      },
    ]),
    ruleId: "labeled-address",
    sourceLabel: "direccion",
    validValue: "Calle 85 # 12-34, Bogota",
  },
  {
    countryProfileIds: ["co"],
    description: "Cedula fuzzy labels",
    invalidValue: "1234",
    negativeLabels: ["registro interno", "codigo cliente"],
    positiveRecipes: Object.freeze([
      {
        description: "digit for letter OCR swap",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "cedu1a",
            search: "cedula",
          },
        ]),
      },
      {
        description: "deleted vowel",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "cedla",
            search: "cedula",
          },
        ]),
      },
      {
        description: "extra consonant",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "ciudaddania",
            search: "ciudadania",
          },
        ]),
      },
      {
        description: "u and l OCR confusion",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "ceduia",
            search: "cedula",
          },
        ]),
      },
    ]),
    ruleId: "cedula-labeled",
    sourceLabel: "cedula de ciudadania",
    validValue: "1020304050",
  },
  {
    countryProfileIds: ["pt"],
    description: "Portuguese NIF fuzzy labels",
    invalidValue: "245716845",
    negativeLabels: ["numero de inscricao", "referencia fiscal"],
    positiveRecipes: Object.freeze([
      {
        description: "m to rn OCR confusion",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "nurnero",
            search: "numero",
          },
        ]),
      },
      {
        description: "digit in fiscal suffix",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "fisca1",
            search: "fiscal",
          },
        ]),
      },
      {
        description: "deleted i in identificacao",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "identifcacao",
            search: "identificacao",
          },
        ]),
      },
      {
        description: "digit in identificacao stem",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "ident1ficacao",
            search: "identificacao",
          },
        ]),
      },
    ]),
    ruleId: "pt-nif-labeled",
    sourceLabel: "numero de identificacao fiscal",
    validValue: "245716840",
  },
  {
    countryProfileIds: ["pt"],
    description: "Portuguese NISS fuzzy labels",
    extraPositiveLabels: ["numero identificacao seguranca social"],
    invalidValue: "11111111111",
    negativeLabels: ["numero de processo", "seguranca do projeto"],
    positiveRecipes: Object.freeze([
      {
        description: "m to rn OCR confusion",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "nurnero",
            search: "numero",
          },
        ]),
      },
      {
        description: "i/l OCR confusion",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "soclal",
            search: "social",
          },
        ]),
      },
      {
        description: "deleted i in identificacao",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "identifcacao",
            search: "identificacao",
          },
        ]),
      },
      {
        description: "digit in social suffix",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "soc1al",
            search: "social",
          },
        ]),
      },
    ]),
    ruleId: "pt-niss-labeled",
    sourceLabel: "numero de identificacao da seguranca social",
    validValue: "12345678901",
  },
  {
    countryProfileIds: ["es"],
    description: "Spanish DNI fuzzy labels",
    invalidValue: "12345678A",
    negativeLabels: ["document archive", "national summary"],
    positiveRecipes: Object.freeze([
      {
        description: "m to rn OCR confusion",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "docurnento",
            search: "documento",
          },
        ]),
      },
      {
        description: "digit in nacional",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "nac1onal",
            search: "nacional",
          },
        ]),
      },
      {
        description: "deleted e in documento",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "documnto",
            search: "documento",
          },
        ]),
      },
      {
        description: "digit in identidad",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "ident1dad",
            search: "identidad",
          },
        ]),
      },
    ]),
    ruleId: "es-dni-labeled",
    sourceLabel: "documento nacional de identidad",
    validValue: "12345678Z",
  },
  {
    countryProfileIds: ["es"],
    description: "Spanish NIE fuzzy labels",
    extraPositiveLabels: ["numero identidad extranjero"],
    invalidValue: "X1234567A",
    negativeLabels: ["travel summary", "identity policy"],
    positiveRecipes: Object.freeze([
      {
        description: "m to rn OCR confusion",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "nurnero",
            search: "numero",
          },
        ]),
      },
      {
        description: "common foreigner misspelling",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "estranjero",
            search: "extranjero",
          },
        ]),
      },
      {
        description: "digit in identidad",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "ident1dad",
            search: "identidad",
          },
        ]),
      },
      {
        description: "ng for nj typo",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "extrangero",
            search: "extranjero",
          },
        ]),
      },
    ]),
    ruleId: "es-nie-labeled",
    sourceLabel: "numero de identidad de extranjero",
    validValue: "X1234567L",
  },
  {
    countryProfileIds: ["cn"],
    description: "Chinese resident ID fuzzy labels",
    extraPositiveLabels: ["shenfenzheng hao"],
    invalidValue: "110105194912310021",
    negativeLabels: [],
    positiveRecipes: Object.freeze([
      {
        description: "split pinyin words",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "shen fen zheng",
            search: "shenfenzheng",
          },
        ]),
      },
      {
        description: "mixed spacing",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "shenfen zheng",
            search: "shenfenzheng",
          },
        ]),
      },
      {
        description: "split suffix only",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "shen fenzheng",
            search: "shenfenzheng",
          },
        ]),
      },
      {
        description: "attached suffix marker",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "shenfenzhenghao",
            search: "shenfenzheng",
          },
        ]),
      },
    ]),
    ruleId: "cn-resident-id-labeled",
    sourceLabel: "shenfenzheng",
    validValue: "11010519491231002X",
  },
  {
    countryProfileIds: ["ru"],
    description: "Russian SNILS fuzzy labels",
    extraPositiveLabels: ["snils number"],
    invalidValue: "112-233-445 94",
    negativeLabels: ["social card", "insurance note"],
    positiveRecipes: Object.freeze([
      {
        description: "digit for letter OCR swap",
        operations: Object.freeze([
          { index: 3, kind: "replace-char", value: "1" },
        ]),
      },
      {
        description: "transposed characters",
        operations: Object.freeze([{ index: 2, kind: "transpose-chars" }]),
      },
      {
        description: "digit in suffix",
        operations: Object.freeze([
          { index: 4, kind: "replace-char", value: "5" },
        ]),
      },
      {
        description: "duplicated ending",
        operations: Object.freeze([
          { index: 5, kind: "insert-char", value: "s" },
        ]),
      },
    ]),
    ruleId: "ru-snils-labeled",
    sourceLabel: "snils",
    validValue: "112-233-445 95",
  },
  {
    countryProfileIds: ["in"],
    description: "Indian Aadhaar fuzzy labels",
    extraPositiveLabels: ["aadhar card number"],
    invalidValue: "2345 6789 1235",
    negativeLabels: ["customer code", "service number"],
    positiveRecipes: Object.freeze([
      {
        description: "deleted vowel",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "aadhr",
            search: "aadhaar",
          },
        ]),
      },
      {
        description: "extra leading a",
        operations: Object.freeze([
          { index: 1, kind: "insert-char", value: "a" },
        ]),
      },
      {
        description: "attached card suffix",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "aadhaar card",
            search: "aadhaar",
          },
        ]),
      },
      {
        description: "reduced transliteration",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "aadhar",
            search: "aadhaar",
          },
        ]),
      },
    ]),
    ruleId: "in-aadhaar-labeled",
    sourceLabel: "aadhaar",
    validValue: "2345 6789 1238",
  },
  {
    countryProfileIds: ["in"],
    description: "Indian PAN fuzzy labels",
    extraPositiveLabels: ["permanent acct number"],
    invalidValue: "ABCD1234F",
    negativeLabels: ["account overview", "residency note"],
    positiveRecipes: Object.freeze([
      {
        description: "common permanent misspelling",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "permament",
            search: "permanent",
          },
        ]),
      },
      {
        description: "deleted consonant",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "acount",
            search: "account",
          },
        ]),
      },
      {
        description: "m to rn OCR confusion",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "nurnber",
            search: "number",
          },
        ]),
      },
      {
        description: "alternate permanent typo",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "permanant",
            search: "permanent",
          },
        ]),
      },
    ]),
    ruleId: "in-pan-labeled",
    sourceLabel: "permanent account number",
    validValue: "ABCDE1234F",
  },
  {
    countryProfileIds: ["in"],
    description: "Indian GSTIN fuzzy labels",
    extraPositiveLabels: ["gst nurnber"],
    invalidValue: "27ABCDE1234F1Y5",
    negativeLabels: ["tax memo", "invoice context"],
    positiveRecipes: Object.freeze([
      {
        description: "number OCR confusion",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "nurnber",
            search: "number",
          },
        ]),
      },
      {
        description: "digit in services",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "serv1ces",
            search: "services",
          },
        ]),
      },
      {
        description: "removed conjunction",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "goods services tax number",
            search: "goods and services tax number",
          },
        ]),
      },
      {
        description: "ampersand shorthand",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "goods & services tax number",
            search: "goods and services tax number",
          },
        ]),
      },
    ]),
    ruleId: "in-gstin-labeled",
    sourceLabel: "goods and services tax number",
    validValue: "27ABCDE1234F1Z5",
  },
  {
    countryProfileIds: ["pe"],
    description: "Peruvian RUC fuzzy labels",
    extraPositiveLabels: ["registro unico contribuyentes"],
    invalidValue: "30123456789",
    negativeLabels: ["supplier note", "registro de proyecto"],
    positiveRecipes: Object.freeze([
      {
        description: "digit in unico",
        operations: Object.freeze([
          { kind: "replace-substring", replacement: "un1co", search: "unico" },
        ]),
      },
      {
        description: "deleted vowel in contribuyentes",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "contribuyents",
            search: "contribuyentes",
          },
        ]),
      },
      {
        description: "OCR double-l confusion",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "contribullentes",
            search: "contribuyentes",
          },
        ]),
      },
      {
        description: "reduced connective wording",
        operations: Object.freeze([
          {
            kind: "replace-substring",
            replacement: "registro unico contribuyentes",
            search: "registro unico de contribuyentes",
          },
        ]),
      },
    ]),
    ruleId: "ruc-labeled",
    sourceLabel: "registro unico de contribuyentes",
    validValue: "20123456786",
  },
]) as readonly FuzzyLabelFuzzSeed[];

export const FUZZY_LABEL_FUZZ_POSITIVE_FIXTURES =
  buildFuzzyLabelPositiveFixtures(FUZZY_LABEL_FUZZ_SEEDS);

export const FUZZY_LABEL_FUZZ_NEGATIVE_FIXTURES =
  buildFuzzyLabelNegativeFixtures(FUZZY_LABEL_FUZZ_SEEDS);
