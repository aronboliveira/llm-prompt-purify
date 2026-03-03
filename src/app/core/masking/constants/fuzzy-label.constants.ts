import type { FuzzyLabelRuleSpec } from "../declarations/fuzzy-label.types";

export const FUZZY_LABEL_DELIMITED_LINE_PATTERN = /^(\s*[^:=\n\r]{2,64}?)\s*[:=]\s*(.+)$/u;

export const FUZZY_LABEL_SPECS: readonly FuzzyLabelRuleSpec[] = Object.freeze([
  {
    aliases: Object.freeze([
      "access token",
      "api key",
      "apikey",
      "client secret",
      "contrasena",
      "password",
      "passwrod",
      "refresh token",
      "senha",
    ]),
    maxScore: 0.24,
    ruleId: "secret-assignment",
  },
  {
    aliases: Object.freeze([
      "telephone",
      "telefone",
      "telefono",
      "telefono principal",
      "phone number",
      "mobile number",
    ]),
    maxScore: 0.2,
    ruleId: "labeled-phone",
    valuePatternFactory: () => /^\+?[0-9()\s.-]{8,20}\d$/u,
  },
  {
    aliases: Object.freeze([
      "full name",
      "ful name",
      "nome completo",
      "nombre completo",
    ]),
    maxScore: 0.22,
    ruleId: "labeled-name",
    valuePatternFactory: () => /^[^\n\r,;]{3,80}$/u,
  },
  {
    aliases: Object.freeze([
      "address",
      "adress",
      "direccion",
      "direcion",
      "endereco",
    ]),
    maxScore: 0.18,
    ruleId: "labeled-address",
    valuePatternFactory: () => /^[^\n\r]{6,120}$/u,
  },
  {
    aliases: Object.freeze([
      "passport",
      "passport number",
      "passaport",
      "pasaporte",
      "passaporte",
    ]),
    maxScore: 0.2,
    ruleId: "labeled-passport",
    valuePatternFactory: () => /^[A-Z0-9<]{6,12}$/iu,
  },
  {
    aliases: Object.freeze(["carteira nacional de habilitacao"]),
    maxScore: 0.2,
    ruleId: "cnh-labeled",
    valuePatternFactory: () => /^\d{11}$/u,
  },
  {
    aliases: Object.freeze([
      "cedula",
      "cedula de ciudadania",
      "cedula de identidad",
    ]),
    maxScore: 0.19,
    ruleId: "cedula-labeled",
    valuePatternFactory: () => /^\d{6,12}$/u,
  },
  {
    aliases: Object.freeze([
      "documento nacional de identidad",
      "document national identity",
    ]),
    maxScore: 0.22,
    ruleId: "dni-labeled",
    valuePatternFactory: () => /^\d{7,8}$/u,
  },
  {
    aliases: Object.freeze([
      "numero de identificacao fiscal",
      "numero identificacao fiscal",
    ]),
    maxScore: 0.27,
    ruleId: "pt-nif-labeled",
    valuePatternFactory: () => /^\d{9}$/u,
  },
  {
    aliases: Object.freeze([
      "numero de identificacao da seguranca social",
      "numero identificacao seguranca social",
    ]),
    maxScore: 0.22,
    ruleId: "pt-niss-labeled",
    valuePatternFactory: () => /^\d{11}$/u,
  },
  {
    aliases: Object.freeze([
      "numero de identidad de extranjero",
      "numero identidad extranjero",
    ]),
    maxScore: 0.2,
    ruleId: "es-nie-labeled",
    valuePatternFactory: () => /^[XYZ]\d{7}[A-Z]$/iu,
  },
  {
    aliases: Object.freeze(["national id", "resident id", "shenfenzheng"]),
    maxScore: 0.2,
    ruleId: "cn-resident-id-labeled",
    valuePatternFactory: () => /^\d{17}[\dXx]$/u,
  },
  {
    aliases: Object.freeze(["aadhaar", "aadhar", "adhaar"]),
    maxScore: 0.21,
    ruleId: "in-aadhaar-labeled",
    valuePatternFactory: () => /^\d{4}\s?\d{4}\s?\d{4}$/u,
  },
  {
    aliases: Object.freeze(["permanent account number"]),
    maxScore: 0.22,
    ruleId: "in-pan-labeled",
    valuePatternFactory: () => /^[A-Z]{5}\d{4}[A-Z]$/iu,
  },
]);
