/**
 * Brazil country-scope matrix fixtures.
 * Covers: CPF, CNPJ, BR phone, CEP, CNH, PIS/PASEP, RG, Titulo de Eleitor.
 * Each rule has multiple format variants, positive + negative + boundary cases.
 */
import type {
  BoundaryMaskFixture,
  LocaleMaskFixture,
  NegativeMaskFixture,
} from "../../declarations/testing.types";

// ─── Positive: CPF ──────────────────────────────────────────────────────────
export const BR_CPF_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["br"],
    description: "masks CPF with dots and dash (529.982.247-25)",
    expectedRuleIds: ["cpf"],
    hiddenValues: ["529.982.247-25"],
    sourceText: "O CPF do titular é 529.982.247-25 no sistema.",
  },
  {
    countryProfileIds: ["br"],
    description: "masks CPF without any formatting (52998224725)",
    expectedRuleIds: ["cpf"],
    hiddenValues: ["52998224725"],
    sourceText: "CPF: 52998224725",
  },
  {
    countryProfileIds: ["br"],
    description: "masks CPF with dots but no dash (529.982.247 25)",
    expectedRuleIds: ["cpf"],
    hiddenValues: ["529.982.24725"],
    sourceText: "CPF registrado: 529.982.24725.",
  },
  {
    countryProfileIds: ["br"],
    description: "masks CPF embedded in a long paragraph",
    expectedRuleIds: ["cpf"],
    hiddenValues: ["347.066.120-04"],
    sourceText:
      "Conforme documentação enviada no último parecer jurídico, o responsável " +
      "identificado pelo CPF 347.066.120-04 solicitou revisão contratual.",
  },
  {
    countryProfileIds: ["br"],
    description: "masks two different CPFs in the same prompt",
    expectedRuleIds: ["cpf"],
    hiddenValues: ["529.982.247-25", "347.066.120-04"],
    sourceText:
      "Titular: CPF 529.982.247-25\nDependente: CPF 347.066.120-04",
  },
  {
    countryProfileIds: ["br"],
    description: "masks CPF followed by email in same block",
    expectedRuleIds: ["cpf", "email-address"],
    hiddenValues: ["529.982.247-25", "joao@empresa.com.br"],
    sourceText: "CPF: 529.982.247-25 — Email: joao@empresa.com.br",
  },
]);

// ─── Negative: CPF ──────────────────────────────────────────────────────────
export const BR_CPF_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["br"],
    description: "ignores CPF with all same digits (111.111.111-11)",
    excludedRuleIds: ["cpf"],
    sourceText: "CPF: 111.111.111-11",
    visibleValues: ["111.111.111-11"],
  },
  {
    countryProfileIds: ["br"],
    description: "ignores CPF with invalid check digits (529.982.247-99)",
    excludedRuleIds: ["cpf"],
    sourceText: "CPF: 529.982.247-99",
    visibleValues: ["529.982.247-99"],
  },
  {
    countryProfileIds: ["br"],
    description: "ignores CPF with only 6 digits",
    excludedRuleIds: ["cpf"],
    sourceText: "CPF do usuário: 529982",
    visibleValues: ["529982"],
  },
  {
    countryProfileIds: ["br"],
    description: "ignores CPF with all zeros (000.000.000-00)",
    excludedRuleIds: ["cpf"],
    sourceText: "CPF: 000.000.000-00",
    visibleValues: ["000.000.000-00"],
  },
]);

// ─── Positive: CNPJ ─────────────────────────────────────────────────────────
export const BR_CNPJ_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["br"],
    description: "masks CNPJ with full formatting (11.222.333/0001-81)",
    expectedRuleIds: ["cnpj"],
    hiddenValues: ["11.222.333/0001-81"],
    sourceText: "CNPJ da empresa: 11.222.333/0001-81.",
  },
  {
    countryProfileIds: ["br"],
    description: "masks CNPJ without formatting (11222333000181)",
    expectedRuleIds: ["cnpj"],
    hiddenValues: ["11222333000181"],
    sourceText: "CNPJ: 11222333000181",
  },
  {
    countryProfileIds: ["br"],
    description: "masks CNPJ in invoice context",
    expectedRuleIds: ["cnpj"],
    hiddenValues: ["11.222.333/0001-81"],
    sourceText:
      "Nota fiscal emitida pelo fornecedor CNPJ 11.222.333/0001-81 no mês de março.",
  },
]);

// ─── Negative: CNPJ ─────────────────────────────────────────────────────────
export const BR_CNPJ_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["br"],
    description: "ignores CNPJ with all same digits (11.111.111/1111-11)",
    excludedRuleIds: ["cnpj"],
    sourceText: "CNPJ: 11.111.111/1111-11",
    visibleValues: ["11.111.111/1111-11"],
  },
  {
    countryProfileIds: ["br"],
    description: "ignores CNPJ with invalid check digits",
    excludedRuleIds: ["cnpj"],
    sourceText: "CNPJ: 11.222.333/0001-99",
    visibleValues: ["11.222.333/0001-99"],
  },
]);

// ─── Positive: BR phone ─────────────────────────────────────────────────────
export const BR_PHONE_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["br"],
    description: "masks BR mobile with country code +55 (11) 99876-5432",
    expectedRuleIds: ["br-phone"],
    hiddenValues: ["+55 (11) 99876-5432"],
    sourceText: "Para +55 (11) 99876-5432 envie a nota.",
  },
  {
    countryProfileIds: ["br"],
    description: "masks BR mobile without country code (11) 98765-4321",
    expectedRuleIds: ["br-phone"],
    hiddenValues: ["(11) 98765-4321"],
    sourceText: "Recebi de (11) 98765-4321 uma mensagem.",
  },
  {
    countryProfileIds: ["br"],
    description: "masks BR mobile without dash 11987654321",
    expectedRuleIds: ["br-phone"],
    hiddenValues: ["11987654321"],
    sourceText: "Ligar para 11987654321 urgente.",
  },
  {
    countryProfileIds: ["br"],
    description: "masks BR landline (21) 3221-5678",
    expectedRuleIds: ["br-phone"],
    hiddenValues: ["(21) 3221-5678"],
    sourceText: "Tel fixo: (21) 3221-5678",
  },
]);

// ─── Positive: CEP labeled ──────────────────────────────────────────────────
export const BR_CEP_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["br"],
    description: "masks CEP with dash label 'CEP: 01310-100'",
    expectedRuleIds: ["cep-labeled"],
    hiddenValues: ["01310-100"],
    sourceText: "CEP: 01310-100",
  },
  {
    countryProfileIds: ["br"],
    description: "masks CEP without dash label 'Código postal: 01310100'",
    expectedRuleIds: ["cep-labeled"],
    hiddenValues: ["01310100"],
    sourceText: "Código postal: 01310100",
  },
  {
    countryProfileIds: ["br"],
    description: "masks CEP in multi-field address block",
    expectedRuleIds: ["cep-labeled", "labeled-name"],
    hiddenValues: ["80010-010", "Roberto Santos"],
    sourceText:
      "Nome completo: Roberto Santos\nCEP: 80010-010\nCidade: Curitiba",
  },
]);

// ─── Negative: CEP ──────────────────────────────────────────────────────────
export const BR_CEP_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["br"],
    description: "ignores CEP without a recognized label",
    excludedRuleIds: ["cep-labeled"],
    sourceText: "O número 01310-100 refere-se ao protocolo.",
    visibleValues: ["01310-100"],
  },
]);

// ─── Positive: CNH labeled ──────────────────────────────────────────────────
export const BR_CNH_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["br"],
    description: "masks CNH with label 'CNH: 04567891234'",
    expectedRuleIds: ["cnh-labeled"],
    hiddenValues: ["04567891234"],
    sourceText: "CNH: 04567891234",
  },
  {
    countryProfileIds: ["br"],
    description: "masks CNH as 'Carteira Nacional de Habilitação: 04567891234'",
    expectedRuleIds: ["cnh-labeled"],
    hiddenValues: ["04567891234"],
    sourceText: "Carteira Nacional de Habilitação: 04567891234",
  },
  {
    countryProfileIds: ["br"],
    description: "masks CNH as 'Registro Nacional de Habilitação: 55566677788'",
    expectedRuleIds: ["cnh-labeled"],
    hiddenValues: ["55566677788"],
    sourceText: "Registro Nacional de Habilitação: 55566677788",
  },
]);

// ─── Positive: PIS/PASEP labeled ────────────────────────────────────────────
export const BR_PIS_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["br"],
    description: "masks PIS with formatted value 'PIS: 123.45678.90-0'",
    expectedRuleIds: ["pis-pasep-labeled"],
    hiddenValues: ["123.45678.90-0"],
    sourceText: "PIS: 123.45678.90-0",
  },
  {
    countryProfileIds: ["br"],
    description: "masks PIS with unformatted value 'PASEP: 12345678900'",
    expectedRuleIds: ["pis-pasep-labeled"],
    hiddenValues: ["12345678900"],
    sourceText: "PASEP: 12345678900",
  },
]);

// ─── Negative: PIS/PASEP ────────────────────────────────────────────────────
export const BR_PIS_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["br"],
    description: "ignores PIS with all same digits",
    excludedRuleIds: ["pis-pasep-labeled"],
    sourceText: "PIS: 111.11111.11-1",
    visibleValues: ["111.11111.11-1"],
  },
]);

// ─── Positive: RG labeled ───────────────────────────────────────────────────
export const BR_RG_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["br"],
    description: "masks RG with dots and dash 'RG: 12.345.678-9'",
    expectedRuleIds: ["rg-labeled"],
    hiddenValues: ["12.345.678-9"],
    sourceText: "RG: 12.345.678-9",
  },
  {
    countryProfileIds: ["br"],
    description: "masks RG without formatting 'Identidade: 123456789'",
    expectedRuleIds: ["rg-labeled"],
    hiddenValues: ["123456789"],
    sourceText: "Identidade: 123456789",
  },
  {
    countryProfileIds: ["br"],
    description: "masks RG with X check digit 'RG: 12.345.678-X'",
    expectedRuleIds: ["rg-labeled"],
    hiddenValues: ["12.345.678-X"],
    sourceText: "RG: 12.345.678-X",
  },
]);

// ─── Negative: RG ───────────────────────────────────────────────────────────
export const BR_RG_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["br"],
    description: "ignores RG with all same digits",
    excludedRuleIds: ["rg-labeled"],
    sourceText: "RG: 11.111.111-1",
    visibleValues: ["11.111.111-1"],
  },
]);

// ─── Positive: Titulo de Eleitor labeled ────────────────────────────────────
export const BR_VOTER_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["br"],
    description: "masks voter title 'Titulo de eleitor: 0123 4567 8901'",
    expectedRuleIds: ["titulo-eleitor-labeled"],
    hiddenValues: ["0123 4567 8901"],
    sourceText: "Titulo de eleitor: 0123 4567 8901",
  },
  {
    countryProfileIds: ["br"],
    description: "masks voter title 'Titulo eleitoral: 012345678901'",
    expectedRuleIds: ["titulo-eleitor-labeled"],
    hiddenValues: ["012345678901"],
    sourceText: "Titulo eleitoral: 012345678901",
  },
]);

// ─── Boundary: BR scope isolation ───────────────────────────────────────────
export const BR_BOUNDARY: readonly BoundaryMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["us"],
    description: "CPF is masked when US is selected via global labeled rule",
    expectedRuleIds: ["cpf-global-labeled", "email-address"],
    hiddenValues: ["529.982.247-25", "maria@example.com"],
    sourceText: "CPF: 529.982.247-25\nEmail: maria@example.com",
  },
  {
    countryProfileIds: ["br"],
    detectionMode: "global-only",
    description: "CPF is masked in global-only mode via global labeled rule",
    expectedRuleIds: ["cpf-global-labeled", "email-address"],
    hiddenValues: ["529.982.247-25", "maria@example.com"],
    sourceText: "CPF: 529.982.247-25\nEmail: maria@example.com",
  },
  {
    countryProfileIds: ["es"],
    description: "CNPJ is masked when Spain is selected via global labeled rule",
    expectedRuleIds: ["cnpj-global-labeled"],
    hiddenValues: ["11.222.333/0001-81"],
    sourceText: "CNPJ: 11.222.333/0001-81",
  },
  {
    countryProfileIds: ["br", "pt"],
    description: "masks both CPF (BR) and NIF (PT) in dual-Portuguese scope",
    expectedRuleIds: ["cpf", "pt-nif-labeled"],
    hiddenValues: ["529.982.247-25", "245716840"],
    sourceText: "CPF: 529.982.247-25\nNIF: 245716840",
  },
  {
    countryProfileIds: ["br"],
    description: "masks CPF + CNPJ + phone + email in a single Brazilian document",
    expectedRuleIds: ["cpf", "cnpj", "br-phone", "email-address"],
    hiddenValues: [
      "529.982.247-25",
      "11.222.333/0001-81",
      "+55 (11) 99876-5432",
      "contato@empresa.com.br",
    ],
    sourceText: [
      "Responsável CPF: 529.982.247-25",
      "Empresa CNPJ: 11.222.333/0001-81",
      "Contato +55 (11) 99876-5432",
      "Email: contato@empresa.com.br",
    ].join("\n"),
  },
]);
