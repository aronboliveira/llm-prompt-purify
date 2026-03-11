/**
 * Faker Masking Strategy
 *
 * Generates numbered placeholder masks like {EMAIL1}, {SSN2}
 * that are clearly identifiable as synthetic data.
 *
 * @module FakerStrategy
 */

import {
  AbstractMaskingStrategy,
  type MaskingContext,
  type MaskingResult,
} from "./masking-strategy.interface";

/**
 * Maps rule IDs and categories to human-readable labels.
 */
const FAKER_LABELS: Readonly<Record<string, string>> = Object.freeze({
  // Global / Shared
  "email-address": "EMAIL",
  "labeled-phone": "PHONE",
  "labeled-name": "NAME",
  "labeled-address": "ADDRESS",
  "labeled-passport": "PASSPORT",
  "credit-card": "CREDIT_CARD",
  "labeled-card-number": "CREDIT_CARD",
  iban: "IBAN",
  "json-sensitive-value": "DATA",
  "yaml-sensitive-value": "DATA",

  // Credentials
  "jwt-token": "JWT",
  "openai-style-key": "OPENAI_KEY",
  "aws-access-key": "AWS_ACCESS",
  "aws-secret-key": "AWS_SECRET",
  "github-pat": "GITHUB_PAT",
  "slack-webhook": "SLACK_WEBHOOK",
  "secret-assignment": "SECRET",
  "keyed-secret-assignment": "SECRET",
  "bearer-token": "BEARER",
  "credential-prefix": "CRED_LABEL",

  // United States
  "us-ssn": "SSN",
  "us-ssn-json": "SSN",
  "us-phone": "US_PHONE",

  // Brazil
  cpf: "CPF",
  "cpf-json": "CPF",
  cnpj: "CNPJ",
  "cnpj-json": "CNPJ",
  "br-phone": "BR_PHONE",
  "cep-labeled": "CEP",
  "cnh-labeled": "CNH",
  "pis-pasep-labeled": "PIS_PASEP",
  "rg-labeled": "RG",
  "titulo-eleitor-labeled": "TITULO_ELEITOR",

  // Latin America & Spain
  "chile-rut": "RUT",
  curp: "CURP",
  rfc: "RFC",
  cuit: "CUIT",
  nit: "NIT",
  "cedula-labeled": "CEDULA",
  "dni-labeled": "DNI",
  "ruc-labeled": "RUC",
  "es-dni-labeled": "ES_DNI",
  "es-nie-labeled": "NIE",

  // Portugal
  "pt-nif-labeled": "NIF",
  "pt-niss-labeled": "NISS",

  // China
  "cn-resident-id-labeled": "CN_RESIDENT_ID",
  "cn-resident-id-json": "CN_RESIDENT_ID",
  "cn-phone": "CN_PHONE",

  // Russia
  "ru-inn-labeled": "INN",
  "ru-snils-labeled": "SNILS",

  // India
  "in-aadhaar-labeled": "AADHAAR",
  "in-pan-labeled": "PAN",
  "in-gstin-labeled": "GSTIN",

  // Category fallbacks
  personal: "PII",
  financial: "FINANCIAL",
  identifier: "ID",
  location: "LOCATION",
  credential: "CREDENTIAL",
});

/**
 * Strategy that generates numbered placeholder masks.
 *
 * @example
 * "john.doe@email.com" → "{EMAIL1}"
 * "123-45-6789" → "{SSN1}"
 */
export class FakerMaskingStrategy extends AbstractMaskingStrategy {
  readonly id = "faker";
  readonly name = "Faker";
  readonly description =
    "Generates numbered placeholder masks like {EMAIL1}, {SSN2}";
  readonly priority = 60;

  protected doMask(context: MaskingContext): MaskingResult {
    // Handle emails with obvious fake domains
    if (this.isEmailContext(context)) {
      return this.maskEmail(context);
    }

    // Handle JWT tokens with low-entropy format
    if (context.ruleId === "jwt-token") {
      return this.maskJwt(context);
    }

    // Handle webhooks
    if (context.ruleId === "slack-webhook") {
      return this.maskWebhook(context);
    }

    // Handle bearer tokens
    if (context.ruleId === "bearer-token") {
      return this.maskBearer(context);
    }

    // Generate numbered placeholder
    const label = this.getLabel(context.ruleId, context.category);
    const counter = context.counterState?.getNext(label) ?? 1;

    return {
      mask: `{${label}${counter}}`,
      complianceApplied: false,
      strategyId: this.id,
      metadata: { label, counter },
    };
  }

  private getLabel(ruleId: string, category: string): string {
    // Try exact match
    if (FAKER_LABELS[ruleId]) return FAKER_LABELS[ruleId];

    // Try partial match
    for (const [pattern, label] of Object.entries(FAKER_LABELS)) {
      if (ruleId.includes(pattern)) return label;
    }

    // Fall back to category
    return FAKER_LABELS[category] ?? "DATA";
  }

  private isEmailContext(context: MaskingContext): boolean {
    return (
      context.ruleId.includes("email") ||
      (context.category === "personal" && /@.*\./.test(context.value))
    );
  }

  private maskEmail(context: MaskingContext): MaskingResult {
    const counter = context.counterState?.getNext("EMAIL") ?? 1;
    const hex = this.randomHex(4);
    const domains = [
      "INVALID-DOMAIN.example",
      "NOT-REAL-ADDR.example",
      "FAKE-MAILBOX.test.example",
    ];
    const domain = domains[this.randomInt(domains.length)];

    return {
      mask: `xXx_user${counter}_${hex}@${domain}`,
      complianceApplied: false,
      strategyId: this.id,
      metadata: { type: "email", counter },
    };
  }

  private maskJwt(context: MaskingContext): MaskingResult {
    const n = context.counterState?.getNext("JWT") ?? 1;
    return {
      mask: `eyJGQUtFX0pXVA.AAAA-BBBB-CCCC-FAKE-JWT-${n}.XXXX-YYYY-ZZZZ-NOT-REAL`,
      complianceApplied: false,
      strategyId: this.id,
      metadata: { type: "jwt", counter: n },
    };
  }

  private maskWebhook(context: MaskingContext): MaskingResult {
    const n = context.counterState?.getNext("WEBHOOK") ?? 1;
    return {
      mask: `https://hooks.slack.com/services/TXXXXXXXX/BYYYYYYYY/FAKE-WEBHOOK-TOKEN-${n}`,
      complianceApplied: false,
      strategyId: this.id,
      metadata: { type: "webhook", counter: n },
    };
  }

  private maskBearer(context: MaskingContext): MaskingResult {
    const n = context.counterState?.getNext("BEARER") ?? 1;
    return {
      mask: `FAKE-BEARER-TOKEN-${n}-XXXX-YYYY-ZZZZ-NOT-REAL`,
      complianceApplied: false,
      strategyId: this.id,
      metadata: { type: "bearer", counter: n },
    };
  }

  private randomHex(length: number): string {
    return this.randomInt(0xffff)
      .toString(16)
      .padStart(length, "0")
      .toUpperCase();
  }

  private randomInt(max: number): number {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.getRandomValues === "function"
    ) {
      return crypto.getRandomValues(new Uint32Array(1))[0] % max;
    }
    return Math.floor(Math.random() * max);
  }
}
