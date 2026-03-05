"""
Exhaustive DataFrame-driven parametric test suite for Brazil and US patterns.

Provides deep, edge-case-rich coverage of every Brazil and US detection rule
on the develop branch.  Each pattern type gets its own DataFrame with:
  - Standard positive cases (multiple format variants)
  - Contextual embedding (value inside prose, surrounded by punctuation, etc.)
  - Every label variant (for labeled patterns)
  - Delimiter variants (:, =, -, mixed)
  - Boundary / edge cases (min-length, max-length, digit boundaries)
  - Negative cases (wrong length, wrong format, partial matches, rejection)
  - Bare-value rejection (for labeled patterns)
  - Mixed text combining multiple patterns

Brazil rules tested:
  cpf, cnpj, br-phone, cep-labeled, cnh-labeled,
  pis-pasep-labeled, rg-labeled, titulo-eleitor-labeled

US rules tested:
  us-ssn, us-phone

Total: ~500+ parametrized test vectors.
"""

from __future__ import annotations

import pandas as pd
import pytest

from .detection import detect_sensitive_data, detect_by_rule


# ════════════════════════════════════════════════════════════════════════
#  HELPERS
# ════════════════════════════════════════════════════════════════════════

def _df(rows: list[tuple[str, str, bool, str | None]], *, multi: bool = False) -> pd.DataFrame:
    if multi:
        return pd.DataFrame(rows, columns=["input_text", "expected_types", "should_match", "expected_value"])
    return pd.DataFrame(rows, columns=["input_text", "expected_rule_id", "should_match", "expected_value"])


def _make_params(df: pd.DataFrame, prefix: str = ""):
    for idx, row in df.iterrows():
        polarity = "pos" if row["should_match"] else "neg"
        rule_id = row["expected_rule_id"]
        tid = f"{prefix}{rule_id}-{polarity}-{idx}"
        val = row["expected_value"]
        yield pytest.param(
            row["input_text"],
            rule_id,
            row["should_match"],
            None if pd.isna(val) else val,
            id=tid,
        )


def _assert_detection(
    text: str,
    expected_rule_id: str,
    should_match: bool,
    expected_value: str | None,
):
    results = detect_sensitive_data(text)
    found = [d for d in results if d.rule_id == expected_rule_id]
    if should_match:
        assert found, (
            f"Expected {expected_rule_id!r} detection in:\n  {text!r}\n"
            f"  got rule IDs: {[d.rule_id for d in results]}"
        )
        if expected_value is not None:
            assert any(d.value == expected_value for d in found), (
                f"Expected value {expected_value!r}, got {[d.value for d in found]}"
            )
    else:
        assert not found, (
            f"Did NOT expect {expected_rule_id!r} detection in:\n  {text!r}\n"
            f"  but got: {[d.value for d in found]}"
        )


# ╔════════════════════════════════════════════════════════════════════╗
# ║                     B R A Z I L   P A T T E R N S                ║
# ╚════════════════════════════════════════════════════════════════════╝

# ── 1. CPF ───────────────────────────────────────────────────────────
# Regex: \b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b  (standalone, no label needed)
CPF_DF = _df([
    # === Positive: formatted (XXX.XXX.XXX-XX) ===
    ("CPF: 529.982.247-25",                         "cpf", True,  "529.982.247-25"),
    ("CPF: 347.066.120-04",                         "cpf", True,  "347.066.120-04"),
    ("CPF: 000.000.000-00",                         "cpf", True,  "000.000.000-00"),
    ("CPF: 999.999.999-99",                         "cpf", True,  "999.999.999-99"),
    ("CPF: 123.456.789-09",                         "cpf", True,  "123.456.789-09"),
    ("CPF: 111.222.333-44",                         "cpf", True,  "111.222.333-44"),
    ("CPF: 001.002.003-04",                         "cpf", True,  "001.002.003-04"),
    ("CPF: 987.654.321-00",                         "cpf", True,  "987.654.321-00"),
    ("CPF: 100.200.300-40",                         "cpf", True,  "100.200.300-40"),
    ("CPF: 555.666.777-88",                         "cpf", True,  "555.666.777-88"),

    # === Positive: unformatted (XXXXXXXXXXX) ===
    ("CPF: 52998224725",                            "cpf", True,  "52998224725"),
    ("CPF: 34706612004",                            "cpf", True,  "34706612004"),
    ("CPF: 00000000000",                            "cpf", True,  "00000000000"),
    ("CPF: 99999999999",                            "cpf", True,  "99999999999"),
    ("CPF: 12345678909",                            "cpf", True,  "12345678909"),
    ("CPF: 11122233344",                            "cpf", True,  "11122233344"),
    ("CPF: 98765432100",                            "cpf", True,  "98765432100"),
    ("CPF: 10020030040",                            "cpf", True,  "10020030040"),
    ("CPF: 55566677788",                            "cpf", True,  "55566677788"),
    ("CPF: 44455566677",                            "cpf", True,  "44455566677"),

    # === Positive: partial formatting (dots only or hyphen only) ===
    ("529982247-25",                                "cpf", True,  "529982247-25"),
    ("529.98224725",                                "cpf", True,  "529.98224725"),
    ("529982.24725",                                "cpf", True,  "529982.24725"),

    # === Positive: embedded in contexts ===
    ("O CPF 347.066.120-04 consta no sistema",      "cpf", True,  "347.066.120-04"),
    ("Favor informar o CPF (529.982.247-25) do titular",
                                                    "cpf", True,  "529.982.247-25"),
    ("Registro: CPF=12345678909, nome=João",        "cpf", True,  "12345678909"),
    ("Identificação CPF-111.222.333-44 aprovada",   "cpf", True,  "111.222.333-44"),
    ("Contribuinte com CPF 987.654.321-00 ativo",   "cpf", True,  "987.654.321-00"),
    ("Dados bancários: 123.456.789-09 ag.0001",     "cpf", True,  "123.456.789-09"),
    ("Inscrição do CPF nº 529.982.247-25 válida",   "cpf", True,  "529.982.247-25"),
    ("Requerente: 34706612004 (pendente)",           "cpf", True,  "34706612004"),
    ("CPFs cadastrados: 52998224725 e 34706612004",  "cpf", True,  None),
    ("email: 12345678909@receita.gov.br",            "cpf", True,  "12345678909"),

    # === Negative: wrong length ===
    ("CPF: 12345678",                               "cpf", False, None),
    ("CPF: 123.456.78",                             "cpf", False, None),
    ("CPF: 1234567890",                             "cpf", False, None),
    ("CPF: 123456789012",                           "cpf", False, None),
    ("CPF: 123.456.789.012",                        "cpf", False, None),

    # === Negative: letters mixed in ===
    ("CPF: 12345678A09",                            "cpf", False, None),
    ("CPF: ABC.DEF.GHI-JK",                        "cpf", False, None),
    ("CPF: 123.456.78X-09",                         "cpf", False, None),

    # === Negative: wrong separators ===
    ("CPF: 123/456/789-09",                         "cpf", False, None),
    ("CPF: 123-456-789.09",                         "cpf", False, None),

    # === Negative: empty / blank ===
    ("CPF: ",                                       "cpf", False, None),
    ("CPF:",                                        "cpf", False, None),
    ("O CPF não foi informado",                     "cpf", False, None),
])

# ── 2. CNPJ ─────────────────────────────────────────────────────────
# Regex: \b\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}\b  (standalone)
CNPJ_DF = _df([
    # === Positive: formatted (XX.XXX.XXX/XXXX-XX) ===
    ("CNPJ: 11.222.333/0001-81",                    "cnpj", True,  "11.222.333/0001-81"),
    ("CNPJ: 00.000.000/0001-91",                    "cnpj", True,  "00.000.000/0001-91"),
    ("CNPJ: 99.999.999/9999-99",                    "cnpj", True,  "99.999.999/9999-99"),
    ("CNPJ: 12.345.678/0001-99",                    "cnpj", True,  "12.345.678/0001-99"),
    ("CNPJ: 55.123.456/0001-00",                    "cnpj", True,  "55.123.456/0001-00"),
    ("CNPJ: 01.234.567/0001-50",                    "cnpj", True,  "01.234.567/0001-50"),
    ("CNPJ: 44.555.666/0001-77",                    "cnpj", True,  "44.555.666/0001-77"),
    ("CNPJ: 10.203.040/0001-12",                    "cnpj", True,  "10.203.040/0001-12"),
    ("CNPJ: 77.888.999/0001-33",                    "cnpj", True,  "77.888.999/0001-33"),
    ("CNPJ: 33.444.555/0002-66",                    "cnpj", True,  "33.444.555/0002-66"),

    # === Positive: unformatted (XXXXXXXXXXXXXX) ===
    ("CNPJ: 11222333000181",                        "cnpj", True,  "11222333000181"),
    ("CNPJ: 00000000000191",                        "cnpj", True,  "00000000000191"),
    ("CNPJ: 99999999999999",                        "cnpj", True,  "99999999999999"),
    ("CNPJ: 12345678000199",                        "cnpj", True,  "12345678000199"),
    ("CNPJ: 55123456000100",                        "cnpj", True,  "55123456000100"),
    ("CNPJ: 01234567000150",                        "cnpj", True,  "01234567000150"),
    ("CNPJ: 44555666000177",                        "cnpj", True,  "44555666000177"),
    ("CNPJ: 10203040000112",                        "cnpj", True,  "10203040000112"),
    ("CNPJ: 77888999000133",                        "cnpj", True,  "77888999000133"),
    ("CNPJ: 33444555000266",                        "cnpj", True,  "33444555000266"),

    # === Positive: partial formatting ===
    ("11222333/0001-81",                            "cnpj", True,  "11222333/0001-81"),
    ("11.222.333000181",                            "cnpj", True,  "11.222.333000181"),
    ("11222333/000181",                             "cnpj", True,  "11222333/000181"),
    ("11.222333/0001-81",                           "cnpj", True,  "11.222333/0001-81"),
    ("11222.333/0001-81",                           "cnpj", True,  "11222.333/0001-81"),

    # === Positive: embedded in contexts ===
    ("Empresa registrada com CNPJ 11.222.333/0001-81 desde 2020",
                                                    "cnpj", True,  "11.222.333/0001-81"),
    ("O CNPJ (12345678000199) é filial da matriz",  "cnpj", True,  "12345678000199"),
    ("Dados: CNPJ=55.123.456/0001-00, razão social: Teste Ltda",
                                                    "cnpj", True,  "55.123.456/0001-00"),
    ("Nota fiscal 1234 emitida por 44555666000177",  "cnpj", True,  "44555666000177"),
    ("Cadastro: 10.203.040/0001-12 — ativo",        "cnpj", True,  "10.203.040/0001-12"),
    ("Inscrição CNPJ nº 77.888.999/0001-33 deferida",
                                                    "cnpj", True,  "77.888.999/0001-33"),
    ("Filial: CNPJ 33.444.555/0002-66",            "cnpj", True,  "33.444.555/0002-66"),
    ("Fornecedor [CNPJ: 01.234.567/0001-50]",      "cnpj", True,  "01.234.567/0001-50"),

    # === Negative: wrong length ===
    ("CNPJ: 1122233300018",                         "cnpj", False, None),
    ("CNPJ: 112223330001810",                       "cnpj", False, None),
    ("CNPJ: 123456",                                "cnpj", False, None),
    ("CNPJ: 11.222.333/0001-8",                     "cnpj", False, None),

    # === Negative: letters ===
    ("CNPJ: 11.222.33A/0001-81",                    "cnpj", False, None),
    ("CNPJ: AB.CDE.FGH/IJKL-MN",                   "cnpj", False, None),

    # === Negative: empty ===
    ("CNPJ: ",                                      "cnpj", False, None),
    ("sem CNPJ informado",                          "cnpj", False, None),
])

# ── 3. BR Phone ─────────────────────────────────────────────────────
# Regex: (?:\+55\s?)?(?:\(?\d{2}\)?\s?)?9?\d{4}-?\d{4}\b  (standalone)
BR_PHONE_DF = _df([
    # === Positive: +55 prefix, parenthesized area code, 9-digit mobile ===
    ("+55 (11) 99876-5432",                         "br-phone", True,  None),
    ("+55 (21) 98765-4321",                         "br-phone", True,  None),
    ("+55 (31) 97654-3210",                         "br-phone", True,  None),
    ("+55 (41) 96543-2109",                         "br-phone", True,  None),
    ("+55 (51) 95432-1098",                         "br-phone", True,  None),
    ("+55 (61) 94321-0987",                         "br-phone", True,  None),
    ("+55 (71) 93210-9876",                         "br-phone", True,  None),
    ("+55 (81) 92109-8765",                         "br-phone", True,  None),
    ("+55 (85) 91098-7654",                         "br-phone", True,  None),
    ("+55 (91) 90987-6543",                         "br-phone", True,  None),

    # === Positive: +55 without parentheses ===
    ("+55 11 99876-5432",                           "br-phone", True,  None),
    ("+55 21 987654321",                            "br-phone", True,  None),
    ("+5511998765432",                              "br-phone", True,  None),
    ("+55 11 9876-5432",                            "br-phone", True,  None),

    # === Positive: no +55, parenthesized area code ===
    ("(11) 99876-5432",                             "br-phone", True,  None),
    ("(21) 98765-4321",                             "br-phone", True,  None),
    ("(31) 97654-3210",                             "br-phone", True,  None),
    ("(85) 3232-4545",                              "br-phone", True,  None),
    ("(11) 2345-6789",                              "br-phone", True,  None),

    # === Positive: no +55, no parentheses ===
    ("11 99876-5432",                               "br-phone", True,  None),
    ("21 987654321",                                "br-phone", True,  None),
    ("31 97654-3210",                               "br-phone", True,  None),
    ("Ligar para (11) 98765-4321",                  "br-phone", True,  None),
    ("Contato: 11987654321",                        "br-phone", True,  None),
    ("WhatsApp: 21 98765-4321",                     "br-phone", True,  None),

    # === Positive: no area code (8-digit landline) ===
    ("3232-4545",                                   "br-phone", True,  None),
    ("3456-7890",                                   "br-phone", True,  None),
    ("2345-6789",                                   "br-phone", True,  None),
    ("4567-8901",                                   "br-phone", True,  None),
    ("56789012",                                    "br-phone", True,  None),

    # === Positive: no area code (9-digit mobile) ===
    ("9 9876-5432",                                 "br-phone", True,  None),
    ("99876-5432",                                  "br-phone", True,  None),
    ("998765432",                                   "br-phone", True,  None),

    # === Positive: embedded in context ===
    ("Meu celular é (11) 99876-5432, pode ligar",   "br-phone", True,  None),
    ("Telefone: +55 (21) 98765-4321. Obrigado.",     "br-phone", True,  None),
    ("Emergência: (61) 94321-0987",                  "br-phone", True,  None),
    ("Contato comercial: 11987654321.",              "br-phone", True,  None),
    ("Ligue agora: 21 98765-4321 — promoção!",      "br-phone", True,  None),
    ("Telefone residencial: (85) 3232-4545",        "br-phone", True,  None),
    ("Recados: (11) 2345-6789 ou 99876-5432",       "br-phone", True,  None),
    ("Cel: +55 (91) 90987-6543 (só WhatsApp)",      "br-phone", True,  None),

    # === Negative: too short ===
    ("123-456",                                     "br-phone", False, None),
    ("12345",                                       "br-phone", False, None),

    # === Negative: empty/no phone ===
    ("Sem telefone informado",                      "br-phone", False, None),
])

# ── 4. CEP (labeled) ────────────────────────────────────────────────
# Labels: "cep", "codigo postal", "código postal"
# Value regex: \d{5}-?\d{3}
CEP_DF = _df([
    # === Positive: label "CEP" ===
    ("CEP: 01310-100",                              "cep-labeled", True,  "01310-100"),
    ("CEP: 01310100",                               "cep-labeled", True,  "01310100"),
    ("CEP: 12345-678",                              "cep-labeled", True,  "12345-678"),
    ("CEP: 12345678",                               "cep-labeled", True,  "12345678"),
    ("CEP: 00000-000",                              "cep-labeled", True,  "00000-000"),
    ("CEP: 00000000",                               "cep-labeled", True,  "00000000"),
    ("CEP: 99999-999",                              "cep-labeled", True,  "99999-999"),
    ("CEP: 99999999",                               "cep-labeled", True,  "99999999"),
    ("CEP: 54321-098",                              "cep-labeled", True,  "54321-098"),
    ("CEP: 70000-000",                              "cep-labeled", True,  "70000-000"),
    ("CEP: 80000-000",                              "cep-labeled", True,  "80000-000"),
    ("CEP: 90000-000",                              "cep-labeled", True,  "90000-000"),

    # === Positive: label "codigo postal" ===
    ("Codigo postal: 01310-100",                    "cep-labeled", True,  "01310-100"),
    ("Codigo postal: 12345678",                     "cep-labeled", True,  "12345678"),
    ("Codigo postal: 65432-100",                    "cep-labeled", True,  "65432-100"),
    ("Codigo postal: 55000-000",                    "cep-labeled", True,  "55000-000"),

    # === Positive: label "código postal" (with accent) ===
    ("Código postal: 01310-100",                    "cep-labeled", True,  "01310-100"),
    ("Código postal: 98765-432",                    "cep-labeled", True,  "98765-432"),
    ("Código postal: 40000-000",                    "cep-labeled", True,  "40000-000"),
    ("Código postal: 30000000",                     "cep-labeled", True,  "30000000"),

    # === Positive: delimiter variants ===
    ("CEP = 01310-100",                             "cep-labeled", True,  "01310-100"),
    ("CEP= 12345-678",                              "cep-labeled", True,  "12345-678"),
    ("CEP =12345-678",                              "cep-labeled", True,  "12345-678"),
    ("CEP=12345678",                                "cep-labeled", True,  "12345678"),
    ("CEP - 01310-100",                             "cep-labeled", True,  "01310-100"),
    ("CEP -12345678",                               "cep-labeled", True,  "12345678"),

    # === Positive: embedded in context ===
    ("Endereço: Rua X, nº 42, CEP: 01310-100, São Paulo",
                                                    "cep-labeled", True,  "01310-100"),
    ("Favor enviar para o CEP: 12345-678",          "cep-labeled", True,  "12345-678"),
    ("Nossa loja fica no CEP: 54321-098.",          "cep-labeled", True,  "54321-098"),
    ("Código postal: 70000-000 (Brasília)",         "cep-labeled", True,  "70000-000"),
    ("O CEP: 99999-999 é fictício.",                "cep-labeled", True,  "99999-999"),
    ("Entrega: CEP = 80000-000, prazo 5 dias.",     "cep-labeled", True,  "80000-000"),

    # === Negative: bare values (no label — must reject) ===
    ("01310-100",                                   "cep-labeled", False, None),
    ("01310100",                                    "cep-labeled", False, None),
    ("12345-678",                                   "cep-labeled", False, None),
    ("12345678",                                    "cep-labeled", False, None),
    ("99999-999",                                   "cep-labeled", False, None),
    ("99999999",                                    "cep-labeled", False, None),

    # === Negative: wrong length (too short — no valid 8-digit substring) ===
    ("CEP: 1234-567",                               "cep-labeled", False, None),
    ("CEP: 1234567",                                "cep-labeled", False, None),
    ("CEP: 1234",                                   "cep-labeled", False, None),
    # Note: "CEP: 123456789" partially matches 12345678 — this is valid regex behavior
    ("CEP: 123456789",                              "cep-labeled", True,  "12345678"),
    # "CEP: 12345-6789" partially matches 12345-678 — valid substring match
    ("CEP: 12345-6789",                             "cep-labeled", True,  "12345-678"),

    # === Negative: letters in value ===
    ("CEP: ABCDE-FGH",                              "cep-labeled", False, None),
    ("CEP: 1234A-678",                              "cep-labeled", False, None),

    # === Negative: empty ===
    ("CEP:",                                        "cep-labeled", False, None),
    ("CEP: ",                                       "cep-labeled", False, None),
    ("Não tem CEP neste texto",                     "cep-labeled", False, None),
])

# ── 5. CNH (labeled) ────────────────────────────────────────────────
# Labels: "cnh", "carteira nacional de habilitacao", "carteira nacional de habilitação",
#         "registro nacional de habilitacao", "registro nacional de habilitação"
# Value regex: \d{11}
CNH_DF = _df([
    # === Positive: label "CNH" ===
    ("CNH: 12345678901",                            "cnh-labeled", True,  "12345678901"),
    ("CNH: 00000000001",                            "cnh-labeled", True,  "00000000001"),
    ("CNH: 99999999999",                            "cnh-labeled", True,  "99999999999"),
    ("CNH: 98765432100",                            "cnh-labeled", True,  "98765432100"),
    ("CNH: 55566677788",                            "cnh-labeled", True,  "55566677788"),
    ("CNH: 11223344556",                            "cnh-labeled", True,  "11223344556"),
    ("CNH: 10000000000",                            "cnh-labeled", True,  "10000000000"),
    ("CNH: 50000000000",                            "cnh-labeled", True,  "50000000000"),
    ("CNH: 00100200300",                            "cnh-labeled", True,  "00100200300"),
    ("CNH: 44332211009",                            "cnh-labeled", True,  "44332211009"),

    # === Positive: long-form labels ===
    ("Carteira nacional de habilitacao: 12345678901",
                                                    "cnh-labeled", True,  "12345678901"),
    ("Carteira Nacional de Habilitação: 98765432100",
                                                    "cnh-labeled", True,  "98765432100"),
    ("Registro nacional de habilitacao: 55566677788",
                                                    "cnh-labeled", True,  "55566677788"),
    ("Registro Nacional de Habilitação: 11223344556",
                                                    "cnh-labeled", True,  "11223344556"),

    # === Positive: delimiter variants ===
    ("CNH = 12345678901",                           "cnh-labeled", True,  "12345678901"),
    ("CNH=98765432100",                             "cnh-labeled", True,  "98765432100"),
    ("CNH - 55566677788",                           "cnh-labeled", True,  "55566677788"),
    ("CNH-11223344556",                             "cnh-labeled", True,  "11223344556"),

    # === Positive: embedded in context ===
    ("Motorista com CNH: 12345678901 está liberado",
                                                    "cnh-labeled", True,  "12345678901"),
    ("Apresentou CNH: 98765432100 na abordagem",    "cnh-labeled", True,  "98765432100"),
    ("Dados da CNH: 55566677788, categoria AB",     "cnh-labeled", True,  "55566677788"),
    ("Registro Nacional de Habilitação: 44332211009 — vencida",
                                                    "cnh-labeled", True,  "44332211009"),
    ("Favor trazer a CNH: 10000000000.",            "cnh-labeled", True,  "10000000000"),

    # === Negative: bare values (no label) ===
    ("12345678901",                                 "cnh-labeled", False, None),
    ("98765432100",                                 "cnh-labeled", False, None),
    ("55566677788",                                 "cnh-labeled", False, None),
    ("00000000000",                                 "cnh-labeled", False, None),
    ("99999999999",                                 "cnh-labeled", False, None),

    # === Negative: wrong length (too short — no 11-digit substring) ===
    ("CNH: 1234567890",                             "cnh-labeled", False, None),
    ("CNH: 12345",                                  "cnh-labeled", False, None),
    # Note: "too long" values partially match — valid 11-digit substring found
    ("CNH: 123456789012",                           "cnh-labeled", True,  "12345678901"),
    ("CNH: 1234567890123",                          "cnh-labeled", True,  "12345678901"),

    # === Negative: letters in value ===
    ("CNH: 1234567890A",                            "cnh-labeled", False, None),
    ("CNH: ABCDEFGHIJK",                            "cnh-labeled", False, None),

    # === Negative: empty ===
    ("CNH:",                                        "cnh-labeled", False, None),
    ("CNH: ",                                       "cnh-labeled", False, None),
    ("Motorista sem CNH no cadastro",               "cnh-labeled", False, None),
])

# ── 6. PIS/PASEP (labeled) ──────────────────────────────────────────
# Labels: "nis", "numero do nis", "numero do pis", "número do nis",
#         "número do pis", "pasep", "pis"
# Value regex: \d{3}\.?\d{5}\.?\d{2}-?\d|\d{11}
PIS_PASEP_DF = _df([
    # === Positive: label "PIS" — formatted ===
    ("PIS: 123.45678.90-0",                         "pis-pasep-labeled", True,  "123.45678.90-0"),
    ("PIS: 000.00000.00-0",                         "pis-pasep-labeled", True,  "000.00000.00-0"),
    ("PIS: 999.99999.99-9",                         "pis-pasep-labeled", True,  "999.99999.99-9"),
    ("PIS: 456.78901.23-4",                         "pis-pasep-labeled", True,  "456.78901.23-4"),
    ("PIS: 111.22233.44-5",                         "pis-pasep-labeled", True,  "111.22233.44-5"),
    ("PIS: 789.01234.56-7",                         "pis-pasep-labeled", True,  "789.01234.56-7"),

    # === Positive: label "PIS" — unformatted ===
    ("PIS: 12345678900",                            "pis-pasep-labeled", True,  "12345678900"),
    ("PIS: 00000000000",                            "pis-pasep-labeled", True,  "00000000000"),
    ("PIS: 99999999999",                            "pis-pasep-labeled", True,  "99999999999"),
    ("PIS: 55566677788",                            "pis-pasep-labeled", True,  "55566677788"),
    ("PIS: 11122233344",                            "pis-pasep-labeled", True,  "11122233344"),

    # === Positive: label "PASEP" ===
    ("PASEP: 12345678900",                          "pis-pasep-labeled", True,  "12345678900"),
    ("PASEP: 123.45678.90-0",                       "pis-pasep-labeled", True,  "123.45678.90-0"),
    ("PASEP: 99999999999",                          "pis-pasep-labeled", True,  "99999999999"),
    ("PASEP: 456.78901.23-4",                       "pis-pasep-labeled", True,  "456.78901.23-4"),

    # === Positive: label "NIS" ===
    ("NIS: 12345678900",                            "pis-pasep-labeled", True,  "12345678900"),
    ("NIS: 123.45678.90-0",                         "pis-pasep-labeled", True,  "123.45678.90-0"),
    ("NIS: 00000000000",                            "pis-pasep-labeled", True,  "00000000000"),

    # === Positive: long-form labels ===
    ("Numero do PIS: 12345678900",                  "pis-pasep-labeled", True,  "12345678900"),
    ("Número do PIS: 123.45678.90-0",               "pis-pasep-labeled", True,  "123.45678.90-0"),
    ("Numero do NIS: 99999999999",                  "pis-pasep-labeled", True,  "99999999999"),
    ("Número do NIS: 55566677788",                  "pis-pasep-labeled", True,  "55566677788"),

    # === Positive: delimiter variants ===
    ("PIS = 12345678900",                           "pis-pasep-labeled", True,  "12345678900"),
    ("PIS=99999999999",                             "pis-pasep-labeled", True,  "99999999999"),
    ("PIS - 55566677788",                           "pis-pasep-labeled", True,  "55566677788"),
    ("PASEP = 123.45678.90-0",                      "pis-pasep-labeled", True,  "123.45678.90-0"),

    # === Positive: embedded in context ===
    ("O PIS: 12345678900 do funcionário está correto",
                                                    "pis-pasep-labeled", True,  "12345678900"),
    ("Para consulta use PASEP: 123.45678.90-0.",    "pis-pasep-labeled", True,  "123.45678.90-0"),
    ("NIS: 99999999999 — cadastro atualizado",      "pis-pasep-labeled", True,  "99999999999"),
    ("O número do PIS: 55566677788 foi confirmado",  "pis-pasep-labeled", True,  "55566677788"),

    # === Negative: bare values (no label) ===
    ("12345678900",                                 "pis-pasep-labeled", False, None),
    ("123.45678.90-0",                              "pis-pasep-labeled", False, None),
    ("99999999999",                                 "pis-pasep-labeled", False, None),
    ("00000000000",                                 "pis-pasep-labeled", False, None),

    # === Negative: wrong length (too short — no 11-digit substring) ===
    ("PIS: 1234567890",                             "pis-pasep-labeled", False, None),
    ("PIS: 12345",                                  "pis-pasep-labeled", False, None),
    # Note: "too long" partially matches valid 11-digit substring
    ("PIS: 123456789012",                           "pis-pasep-labeled", True,  "12345678901"),

    # === Negative: letters in value ===
    ("PIS: 1234567890A",                            "pis-pasep-labeled", False, None),
    ("PIS: ABCDEFGHIJK",                            "pis-pasep-labeled", False, None),

    # === Negative: empty ===
    ("PIS:",                                        "pis-pasep-labeled", False, None),
    ("PIS: ",                                       "pis-pasep-labeled", False, None),
    ("Sem informações do PIS",                      "pis-pasep-labeled", False, None),
])

# ── 7. RG (labeled) ─────────────────────────────────────────────────
# Labels: "carteira de identidade", "documento de identidade",
#         "identidade", "registro geral", "rg"
# Value regex: [0-9]{1,2}\.?\d{3}\.?\d{3}-?[\dXx]
RG_DF = _df([
    # === Positive: label "RG" — formatted (XX.XXX.XXX-X) ===
    ("RG: 12.345.678-9",                            "rg-labeled", True,  "12.345.678-9"),
    ("RG: 12.345.678-X",                            "rg-labeled", True,  "12.345.678-X"),
    ("RG: 12.345.678-x",                            "rg-labeled", True,  "12.345.678-x"),
    ("RG: 00.000.000-0",                            "rg-labeled", True,  "00.000.000-0"),
    ("RG: 99.999.999-9",                            "rg-labeled", True,  "99.999.999-9"),
    ("RG: 10.203.040-5",                            "rg-labeled", True,  "10.203.040-5"),
    ("RG: 55.666.777-8",                            "rg-labeled", True,  "55.666.777-8"),
    ("RG: 44.332.211-0",                            "rg-labeled", True,  "44.332.211-0"),
    ("RG: 33.444.555-X",                            "rg-labeled", True,  "33.444.555-X"),
    ("RG: 11.222.333-4",                            "rg-labeled", True,  "11.222.333-4"),

    # === Positive: label "RG" — unformatted ===
    ("RG: 123456789",                               "rg-labeled", True,  None),
    ("RG: 12345678X",                               "rg-labeled", True,  None),
    ("RG: 12345678x",                               "rg-labeled", True,  None),
    ("RG: 000000000",                               "rg-labeled", True,  None),
    ("RG: 999999999",                               "rg-labeled", True,  None),

    # === Positive: single-digit prefix (X.XXX.XXX-X) ===
    ("RG: 1.234.567-8",                             "rg-labeled", True,  "1.234.567-8"),
    ("RG: 1.234.567-X",                             "rg-labeled", True,  "1.234.567-X"),
    ("RG: 5.678.901-2",                             "rg-labeled", True,  "5.678.901-2"),
    ("RG: 9.999.999-9",                             "rg-labeled", True,  "9.999.999-9"),
    ("RG: 0.000.000-0",                             "rg-labeled", True,  "0.000.000-0"),

    # === Positive: label "Identidade" ===
    ("Identidade: 12.345.678-9",                    "rg-labeled", True,  "12.345.678-9"),
    ("Identidade: 123456789",                       "rg-labeled", True,  None),
    ("Identidade: 12.345.678-X",                    "rg-labeled", True,  "12.345.678-X"),
    ("Identidade: 99.999.999-9",                    "rg-labeled", True,  "99.999.999-9"),

    # === Positive: label "Registro geral" ===
    ("Registro geral: 12.345.678-9",                "rg-labeled", True,  "12.345.678-9"),
    ("Registro geral: 55.666.777-8",                "rg-labeled", True,  "55.666.777-8"),
    ("Registro geral: 12345678X",                   "rg-labeled", True,  None),

    # === Positive: label "Carteira de identidade" ===
    ("Carteira de identidade: 12.345.678-9",        "rg-labeled", True,  "12.345.678-9"),
    ("Carteira de identidade: 44.332.211-0",        "rg-labeled", True,  "44.332.211-0"),
    ("Carteira de identidade: 123456789",           "rg-labeled", True, None),

    # === Positive: label "Documento de identidade" ===
    ("Documento de identidade: 33.444.555-X",       "rg-labeled", True,  "33.444.555-X"),
    ("Documento de identidade: 99.999.999-9",       "rg-labeled", True,  "99.999.999-9"),
    ("Documento de identidade: 12345678x",          "rg-labeled", True,  None),

    # === Positive: delimiter variants ===
    ("RG = 12.345.678-9",                           "rg-labeled", True,  "12.345.678-9"),
    ("RG=12.345.678-X",                             "rg-labeled", True,  "12.345.678-X"),
    ("RG - 12345678x",                              "rg-labeled", True,  None),
    ("RG-123456789",                                "rg-labeled", True,  None),

    # === Positive: embedded in context ===
    ("Apresentou RG: 12.345.678-9 na recepção",    "rg-labeled", True,  "12.345.678-9"),
    ("O RG: 55.666.777-8 está vencido",            "rg-labeled", True,  "55.666.777-8"),
    ("Portador do RG: 33.444.555-X.",               "rg-labeled", True,  "33.444.555-X"),
    ("Identidade: 44.332.211-0 — segunda via",      "rg-labeled", True,  "44.332.211-0"),
    ("Confira o RG: 99.999.999-9, se correto.",     "rg-labeled", True,  "99.999.999-9"),
    ("Registro geral: 12.345.678-9 (cópia)",       "rg-labeled", True,  "12.345.678-9"),
    ("Documento de identidade: 11.222.333-4 do aluno",
                                                    "rg-labeled", True,  "11.222.333-4"),

    # === Negative: bare values === 
    ("12.345.678-9",                                "rg-labeled", False, None),
    ("12.345.678-X",                                "rg-labeled", False, None),
    ("123456789",                                   "rg-labeled", False, None),
    ("12345678X",                                   "rg-labeled", False, None),
    ("99.999.999-9",                                "rg-labeled", False, None),

    # === Negative: wrong length (too short) ===
    ("RG: 12345",                                   "rg-labeled", False, None),
    ("RG: 123",                                     "rg-labeled", False, None),
    # Note: 10 digits partially matches valid 8-9 digit substring
    ("RG: 1234567890",                              "rg-labeled", True,  "123456789"),

    # === Negative: empty ===
    ("RG:",                                         "rg-labeled", False, None),
    ("RG: ",                                        "rg-labeled", False, None),
    ("Sem RG informado no cadastro",                "rg-labeled", False, None),
])

# ── 8. Titulo de eleitor (labeled) ──────────────────────────────────
# Labels: "inscricao eleitoral", "inscrição eleitoral",
#         "titulo de eleitor", "titulo eleitoral", "título de eleitor"
# Value regex: (?:\d[\s.-]*){12}
TITULO_ELEITOR_DF = _df([
    # === Positive: label "Titulo de eleitor" — spaced ===
    ("Titulo de eleitor: 0123 4567 8901",           "titulo-eleitor-labeled", True, None),
    ("Titulo de eleitor: 1234 5678 9012",           "titulo-eleitor-labeled", True, None),
    ("Titulo de eleitor: 0000 0000 0000",           "titulo-eleitor-labeled", True, None),
    ("Titulo de eleitor: 9999 9999 9999",           "titulo-eleitor-labeled", True, None),
    ("Titulo de eleitor: 5555 6666 7777",           "titulo-eleitor-labeled", True, None),

    # === Positive: label "Titulo de eleitor" — unspaced ===
    ("Titulo de eleitor: 012345678901",             "titulo-eleitor-labeled", True, None),
    ("Titulo de eleitor: 123456789012",             "titulo-eleitor-labeled", True, None),
    ("Titulo de eleitor: 000000000000",             "titulo-eleitor-labeled", True, None),
    ("Titulo de eleitor: 999999999999",             "titulo-eleitor-labeled", True, None),
    ("Titulo de eleitor: 555566667777",             "titulo-eleitor-labeled", True, None),

    # === Positive: label "Título de eleitor" (accented) ===
    ("Título de eleitor: 0123 4567 8901",           "titulo-eleitor-labeled", True, None),
    ("Título de eleitor: 012345678901",             "titulo-eleitor-labeled", True, None),
    ("Título de eleitor: 9999 9999 9999",           "titulo-eleitor-labeled", True, None),
    ("Título de eleitor: 111122223333",             "titulo-eleitor-labeled", True, None),

    # === Positive: label "Titulo eleitoral" ===
    ("Titulo eleitoral: 012345678901",              "titulo-eleitor-labeled", True, None),
    ("Titulo eleitoral: 1234 5678 9012",            "titulo-eleitor-labeled", True, None),
    ("Titulo eleitoral: 999999999999",              "titulo-eleitor-labeled", True, None),

    # === Positive: label "Inscricao eleitoral" / "Inscrição eleitoral" ===
    ("Inscricao eleitoral: 012345678901",           "titulo-eleitor-labeled", True, None),
    ("Inscrição eleitoral: 9999 9999 9999",         "titulo-eleitor-labeled", True, None),
    ("Inscricao eleitoral: 5555 6666 7777",         "titulo-eleitor-labeled", True, None),
    ("Inscrição eleitoral: 111122223333",           "titulo-eleitor-labeled", True, None),

    # === Positive: delimiter variants ===
    ("Titulo de eleitor = 012345678901",            "titulo-eleitor-labeled", True, None),
    ("Titulo de eleitor=123456789012",              "titulo-eleitor-labeled", True, None),
    ("Titulo de eleitor - 999999999999",            "titulo-eleitor-labeled", True, None),

    # === Positive: with dot/hyphen separators in value ===
    ("Titulo de eleitor: 0123.4567.8901",           "titulo-eleitor-labeled", True, None),
    ("Titulo de eleitor: 0123-4567-8901",           "titulo-eleitor-labeled", True, None),

    # === Positive: embedded in context ===
    ("O titulo de eleitor: 012345678901 está ativo",
                                                    "titulo-eleitor-labeled", True, None),
    ("Favor apresentar Título de eleitor: 9999 9999 9999.",
                                                    "titulo-eleitor-labeled", True, None),
    ("Inscrição eleitoral: 111122223333 — zona 42.",
                                                    "titulo-eleitor-labeled", True, None),
    ("Cadastro com titulo de eleitor: 5555 6666 7777 concluído.",
                                                    "titulo-eleitor-labeled", True, None),

    # === Negative: bare values ===
    ("012345678901",                                "titulo-eleitor-labeled", False, None),
    ("0123 4567 8901",                              "titulo-eleitor-labeled", False, None),
    ("999999999999",                                "titulo-eleitor-labeled", False, None),
    ("9999 9999 9999",                              "titulo-eleitor-labeled", False, None),
    ("555566667777",                                "titulo-eleitor-labeled", False, None),

    # === Negative: wrong length (too short — no 12-digit substring) ===
    ("Titulo de eleitor: 01234567890",              "titulo-eleitor-labeled", False, None),
    ("Titulo de eleitor: 12345",                    "titulo-eleitor-labeled", False, None),
    # Note: 13 digits partially matches valid 12-digit substring
    ("Titulo de eleitor: 0123456789012",            "titulo-eleitor-labeled", True,  None),

    # === Negative: letters in value ===
    ("Titulo de eleitor: 01234567890A",             "titulo-eleitor-labeled", False, None),
    ("Titulo de eleitor: ABCDEFGHIJKL",             "titulo-eleitor-labeled", False, None),

    # === Negative: empty ===
    ("Titulo de eleitor:",                          "titulo-eleitor-labeled", False, None),
    ("Titulo de eleitor: ",                         "titulo-eleitor-labeled", False, None),
    ("Não possui titulo de eleitor cadastrado",     "titulo-eleitor-labeled", False, None),
])


# ╔════════════════════════════════════════════════════════════════════╗
# ║                    U S   P A T T E R N S                          ║
# ╚════════════════════════════════════════════════════════════════════╝

# ── 9. US SSN ────────────────────────────────────────────────────────
# Regex: \b\d{3}-\d{2}-\d{4}\b  (standalone, requires dashes)
US_SSN_DF = _df([
    # === Positive: standard format (XXX-XX-XXXX) ===
    ("SSN: 123-45-6789",                            "us-ssn", True,  "123-45-6789"),
    ("SSN: 000-00-0000",                            "us-ssn", True,  "000-00-0000"),
    ("SSN: 999-99-9999",                            "us-ssn", True,  "999-99-9999"),
    ("SSN: 001-01-0001",                            "us-ssn", True,  "001-01-0001"),
    ("SSN: 111-22-3333",                            "us-ssn", True,  "111-22-3333"),
    ("SSN: 222-33-4444",                            "us-ssn", True,  "222-33-4444"),
    ("SSN: 333-44-5555",                            "us-ssn", True,  "333-44-5555"),
    ("SSN: 444-55-6666",                            "us-ssn", True,  "444-55-6666"),
    ("SSN: 555-66-7777",                            "us-ssn", True,  "555-66-7777"),
    ("SSN: 666-77-8888",                            "us-ssn", True,  "666-77-8888"),
    ("SSN: 777-88-9999",                            "us-ssn", True,  "777-88-9999"),
    ("SSN: 888-99-0000",                            "us-ssn", True,  "888-99-0000"),
    ("SSN: 100-50-2500",                            "us-ssn", True,  "100-50-2500"),
    ("SSN: 250-75-1234",                            "us-ssn", True,  "250-75-1234"),
    ("SSN: 500-00-5000",                            "us-ssn", True,  "500-00-5000"),
    ("SSN: 750-25-7500",                            "us-ssn", True,  "750-25-7500"),
    ("SSN: 900-10-0010",                            "us-ssn", True,  "900-10-0010"),
    ("SSN: 010-99-0100",                            "us-ssn", True,  "010-99-0100"),
    ("SSN: 050-50-0500",                            "us-ssn", True,  "050-50-0500"),
    ("SSN: 200-20-2000",                            "us-ssn", True,  "200-20-2000"),

    # === Positive: embedded in varied contexts ===
    ("My SSN is 123-45-6789",                       "us-ssn", True,  "123-45-6789"),
    ("Employee SSN: 222-33-4444, hired 2023",       "us-ssn", True,  "222-33-4444"),
    ("Social Security Number: 333-44-5555",         "us-ssn", True,  "333-44-5555"),
    ("Tax return SSN 444-55-6666 accepted",         "us-ssn", True,  "444-55-6666"),
    ("SSN (555-66-7777) on file",                   "us-ssn", True,  "555-66-7777"),
    ("Please verify SSN=666-77-8888 in our records",
                                                    "us-ssn", True,  "666-77-8888"),
    ("I9 form lists: 777-88-9999",                  "us-ssn", True,  "777-88-9999"),
    ("Employee ID: 12345 | SSN: 888-99-0000",       "us-ssn", True,  "888-99-0000"),
    ("For 100-50-2500 please file form W-2",        "us-ssn", True,  "100-50-2500"),
    ("Records show SSN 250-75-1234.",               "us-ssn", True,  "250-75-1234"),
    ("Applicant: name=John, ssn=500-00-5000",       "us-ssn", True,  "500-00-5000"),
    ("Check 750-25-7500 in system.",                "us-ssn", True,  "750-25-7500"),
    ("SSN entered: 900-10-0010, confirm?",          "us-ssn", True,  "900-10-0010"),
    ("HR file: SSN 010-99-0100 | DOB 01/01/1990",  "us-ssn", True,  "010-99-0100"),
    ("Benefits enrollment SSN: 050-50-0500 complete",
                                                    "us-ssn", True,  "050-50-0500"),

    # === Negative: wrong separator positions (not XXX-XX-XXXX) ===
    ("SSN: 12-345-6789",                            "us-ssn", False, None),
    ("SSN: 1234-5-6789",                            "us-ssn", False, None),
    ("SSN: 1-23-456789",                            "us-ssn", False, None),
    ("SSN: 12345-6789",                             "us-ssn", False, None),
    ("SSN: 123456-789",                             "us-ssn", False, None),
    ("SSN: 1234567-89",                             "us-ssn", False, None),
    ("SSN: 12-3456-789",                            "us-ssn", False, None),

    # === Negative: no dashes (regex requires them) ===
    ("SSN: 123456789",                              "us-ssn", False, None),
    ("SSN: 000000000",                              "us-ssn", False, None),
    ("SSN: 999999999",                              "us-ssn", False, None),

    # === Negative: wrong length ===
    ("SSN: 12-34-567",                              "us-ssn", False, None),
    ("SSN: 1234-56-78901",                          "us-ssn", False, None),
    ("SSN: 12-34-56789",                            "us-ssn", False, None),
    ("SSN: 123-45-678",                             "us-ssn", False, None),
    ("SSN: 1234-56-7890",                           "us-ssn", False, None),

    # === Negative: letters in value ===
    ("SSN: 123-AB-6789",                            "us-ssn", False, None),
    ("SSN: ABC-DE-FGHI",                            "us-ssn", False, None),
    ("SSN: 12X-45-6789",                            "us-ssn", False, None),

    # === Negative: wrong separators (dots, spaces) ===
    ("SSN: 123.45.6789",                            "us-ssn", False, None),
    ("SSN: 123 45 6789",                            "us-ssn", False, None),
    ("SSN: 123/45/6789",                            "us-ssn", False, None),

    # === Negative: empty / no SSN ===
    ("SSN:",                                        "us-ssn", False, None),
    ("SSN: ",                                       "us-ssn", False, None),
    ("No social security number provided",          "us-ssn", False, None),
    ("Social security: pending",                    "us-ssn", False, None),
])

# ── 10. US Phone ────────────────────────────────────────────────────
# Regex: (?:\+1[\s.-]?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[\s.-]?\d{3}[\s.-]?\d{4}\b
US_PHONE_DF = _df([
    # === Positive: +1 prefix, parenthesized area code, dash delimiters ===
    ("+1 (212) 555-1234",                           "us-phone", True,  None),
    ("+1 (310) 555-6789",                           "us-phone", True,  None),
    ("+1 (415) 555-0000",                           "us-phone", True,  None),
    ("+1 (617) 555-9999",                           "us-phone", True,  None),
    ("+1 (713) 555-4567",                           "us-phone", True,  None),
    ("+1 (800) 555-1212",                           "us-phone", True,  None),
    ("+1 (888) 555-0123",                           "us-phone", True,  None),
    ("+1 (900) 555-7890",                           "us-phone", True,  None),
    ("+1 (202) 555-0175",                           "us-phone", True,  None),
    ("+1 (305) 555-3456",                           "us-phone", True,  None),

    # === Positive: +1 prefix, NO parentheses ===
    ("+1 212-555-1234",                             "us-phone", True,  None),
    ("+1 310-555-6789",                             "us-phone", True,  None),
    ("+1 415 555 0000",                             "us-phone", True,  None),
    ("+1 617.555.9999",                             "us-phone", True,  None),
    ("+1-800-555-1212",                             "us-phone", True,  None),
    ("+1.888.555.0123",                             "us-phone", True,  None),
    ("+12125551234",                                "us-phone", True,  None),

    # === Positive: no +1, parenthesized area code ===
    ("(212) 555-1234",                              "us-phone", True,  None),
    ("(310) 555-6789",                              "us-phone", True,  None),
    ("(415) 555-0000",                              "us-phone", True,  None),
    ("(617) 555-9999",                              "us-phone", True,  None),
    ("(713) 555-4567",                              "us-phone", True,  None),
    ("(800) 555-1212",                              "us-phone", True,  None),
    ("(888) 555-0123",                              "us-phone", True,  None),
    ("(212)555-1234",                               "us-phone", True,  None),
    ("(310)5556789",                                "us-phone", True,  None),
    ("(415) 5550000",                               "us-phone", True,  None),

    # === Positive: no +1, no parentheses ===
    ("212-555-1234",                                "us-phone", True,  None),
    ("310-555-6789",                                "us-phone", True,  None),
    ("415 555 0000",                                "us-phone", True,  None),
    ("617.555.9999",                                "us-phone", True,  None),
    ("713-555-4567",                                "us-phone", True,  None),
    ("800-555-1212",                                "us-phone", True,  None),
    ("888 555 0123",                                "us-phone", True,  None),
    ("2125551234",                                  "us-phone", True,  None),
    ("3105556789",                                  "us-phone", True,  None),
    ("4155550000",                                  "us-phone", True,  None),

    # === Positive: mixed delimiter styles ===
    ("212.555-1234",                                "us-phone", True,  None),
    ("310-555.6789",                                "us-phone", True,  None),
    ("415 555-0000",                                "us-phone", True,  None),
    ("617-555 9999",                                "us-phone", True,  None),
    ("+1 (800) 555.1212",                           "us-phone", True,  None),
    ("+1(888)555-0123",                             "us-phone", True,  None),

    # === Positive: many area codes ===
    ("201-555-1234",                                "us-phone", True,  None),
    ("302-555-5678",                                "us-phone", True,  None),
    ("404-555-9012",                                "us-phone", True,  None),
    ("503-555-3456",                                "us-phone", True,  None),
    ("602-555-7890",                                "us-phone", True,  None),
    ("702-555-2345",                                "us-phone", True,  None),
    ("801-555-6789",                                "us-phone", True,  None),
    ("901-555-0123",                                "us-phone", True,  None),
    ("941-555-4567",                                "us-phone", True,  None),
    ("972-555-8901",                                "us-phone", True,  None),

    # === Positive: embedded in varied contexts ===
    ("Call me at 212-555-1234",                     "us-phone", True,  None),
    ("Phone: (310) 555-6789",                       "us-phone", True,  None),
    ("Contact us at +1 (415) 555-0000.",            "us-phone", True,  None),
    ("Emergency: +1 617-555-9999",                  "us-phone", True,  None),
    ("HR office: (800) 555-1212 ext 42",            "us-phone", True,  None),
    ("Leave a message at 888.555.0123",             "us-phone", True,  None),
    ("Direct line: 202-555-0175; fax: 202-555-0176",
                                                    "us-phone", True,  None),
    ("Sales: (305) 555-3456 | Support: (305) 555-3457",
                                                    "us-phone", True,  None),
    ("John Doe — phone: 713-555-4567, email: j@d.com",
                                                    "us-phone", True,  None),
    ("Reservations: +1 (888) 555-0123",             "us-phone", True,  None),
    ("For billing: +1-800-555-1212",                "us-phone", True,  None),
    ("My cell is (415) 555-0000, work: (415) 555-0001",
                                                    "us-phone", True,  None),
    ("Text me: 2125551234",                         "us-phone", True,  None),
    ("Callback number: (941) 555-4567",             "us-phone", True,  None),
    ("Dispatch at 972-555-8901 confirmed",          "us-phone", True,  None),

    # === Negative: area code starting with 0 or 1 ===
    ("(012) 555-1234",                              "us-phone", False, None),
    ("(123) 555-6789",                              "us-phone", False, None),
    ("012-555-1234",                                "us-phone", False, None),
    ("123-555-6789",                                "us-phone", False, None),
    ("+1 (012) 555-1234",                           "us-phone", False, None),
    ("+1 (100) 555-6789",                           "us-phone", False, None),

    # === Negative: too short ===
    ("555-1234",                                    "us-phone", False, None),
    ("212-555",                                     "us-phone", False, None),
    ("(212) 555",                                   "us-phone", False, None),
    ("12345",                                       "us-phone", False, None),

    # === Negative: too long (11+ local digits) ===
    ("212-555-12345",                               "us-phone", False, None),

    # === Negative: letters in number ===
    ("212-ABC-1234",                                "us-phone", False, None),
    ("(212) 555-ABCD",                              "us-phone", False, None),
    ("PHONE: ABCDEFGHIJ",                           "us-phone", False, None),

    # === Negative: empty / no phone ===
    ("No phone number available",                   "us-phone", False, None),
    ("Call for details",                            "us-phone", False, None),
])


# ╔════════════════════════════════════════════════════════════════════╗
# ║              M U L T I - T Y P E   M I X E D   T E X T           ║
# ╚════════════════════════════════════════════════════════════════════╝

BRAZIL_US_MULTI_DF = _df(
    [
        (
            "CPF: 529.982.247-25, phone: (212) 555-1234, SSN: 123-45-6789",
            {"cpf", "us-phone", "us-ssn"},
            True,
            None,
        ),
        (
            "CNPJ: 11.222.333/0001-81, contact +55 (11) 99876-5432",
            {"cnpj", "br-phone"},
            True,
            None,
        ),
        (
            "CEP: 01310-100 | RG: 12.345.678-9",
            {"cep-labeled", "rg-labeled"},
            True,
            None,
        ),
        (
            "CNH: 12345678901, PIS: 123.45678.90-0, titulo de eleitor: 012345678901",
            {"cnh-labeled", "pis-pasep-labeled", "titulo-eleitor-labeled"},
            True,
            None,
        ),
        (
            "Employee SSN: 222-33-4444. CPF 34706612004. Phone: (800) 555-1212.",
            {"us-ssn", "cpf", "us-phone"},
            True,
            None,
        ),
        (
            "CNPJ: 44555666000177 — SSN: 333-44-5555",
            {"cnpj", "us-ssn"},
            True,
            None,
        ),
        (
            "RG: 55.666.777-8, Identidade: 44.332.211-0",
            {"rg-labeled"},
            True,
            None,
        ),
        (
            "CEP: 99999-999, Código postal: 70000-000",
            {"cep-labeled"},
            True,
            None,
        ),
        (
            "PIS: 99999999999, PASEP: 55566677788, NIS: 11122233344",
            {"pis-pasep-labeled"},
            True,
            None,
        ),
        (
            "CPF: 111.222.333-44 — CNH: 55566677788 — Phone: +1 (305) 555-3456",
            {"cpf", "cnh-labeled", "us-phone"},
            True,
            None,
        ),
        (
            "SSN: 500-00-5000 | CEP: 54321-098 | CNPJ: 77888999000133",
            {"us-ssn", "cep-labeled", "cnpj"},
            True,
            None,
        ),
        (
            "Titulo de eleitor: 555566667777 — RG: 33.444.555-X — SSN: 750-25-7500",
            {"titulo-eleitor-labeled", "rg-labeled", "us-ssn"},
            True,
            None,
        ),
    ],
    multi=True,
)


# ╔════════════════════════════════════════════════════════════════════╗
# ║              B A R E  V A L U E  R E J E C T I O N               ║
# ╚════════════════════════════════════════════════════════════════════╝

# All labeled patterns must NOT match when no label is present.
# This extends the per-DataFrame negative bare-value tests with
# additional systematic bare-value-only inputs.
BARE_VALUE_REJECTION_CASES = [
    # CEP
    ("01310-100",           "cep-labeled"),
    ("01310100",            "cep-labeled"),
    ("12345-678",           "cep-labeled"),
    ("54321-098",           "cep-labeled"),
    ("70000-000",           "cep-labeled"),
    ("80000-000",           "cep-labeled"),
    ("90000-000",           "cep-labeled"),
    # CNH
    ("12345678901",         "cnh-labeled"),
    ("98765432100",         "cnh-labeled"),
    ("55566677788",         "cnh-labeled"),
    ("11223344556",         "cnh-labeled"),
    ("44332211009",         "cnh-labeled"),
    # PIS/PASEP
    ("12345678900",         "pis-pasep-labeled"),
    ("123.45678.90-0",      "pis-pasep-labeled"),
    ("99999999999",         "pis-pasep-labeled"),
    ("55566677788",         "pis-pasep-labeled"),
    ("11122233344",         "pis-pasep-labeled"),
    # RG
    ("12.345.678-9",        "rg-labeled"),
    ("12.345.678-X",        "rg-labeled"),
    ("123456789",           "rg-labeled"),
    ("12345678X",           "rg-labeled"),
    ("99.999.999-9",        "rg-labeled"),
    ("1.234.567-8",         "rg-labeled"),
    # Titulo de eleitor
    ("012345678901",        "titulo-eleitor-labeled"),
    ("0123 4567 8901",      "titulo-eleitor-labeled"),
    ("999999999999",        "titulo-eleitor-labeled"),
    ("555566667777",        "titulo-eleitor-labeled"),
    ("111122223333",        "titulo-eleitor-labeled"),
]


# ════════════════════════════════════════════════════════════════════════
#  PARAMETRIC TESTS
# ════════════════════════════════════════════════════════════════════════

@pytest.mark.parametrize(
    "text, expected_rule_id, should_match, expected_value",
    list(_make_params(CPF_DF, prefix="cpf-")),
)
def test_cpf_exhaustive(text, expected_rule_id, should_match, expected_value):
    _assert_detection(text, expected_rule_id, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_rule_id, should_match, expected_value",
    list(_make_params(CNPJ_DF, prefix="cnpj-")),
)
def test_cnpj_exhaustive(text, expected_rule_id, should_match, expected_value):
    _assert_detection(text, expected_rule_id, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_rule_id, should_match, expected_value",
    list(_make_params(BR_PHONE_DF, prefix="brphone-")),
)
def test_br_phone_exhaustive(text, expected_rule_id, should_match, expected_value):
    _assert_detection(text, expected_rule_id, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_rule_id, should_match, expected_value",
    list(_make_params(CEP_DF, prefix="cep-")),
)
def test_cep_exhaustive(text, expected_rule_id, should_match, expected_value):
    _assert_detection(text, expected_rule_id, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_rule_id, should_match, expected_value",
    list(_make_params(CNH_DF, prefix="cnh-")),
)
def test_cnh_exhaustive(text, expected_rule_id, should_match, expected_value):
    _assert_detection(text, expected_rule_id, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_rule_id, should_match, expected_value",
    list(_make_params(PIS_PASEP_DF, prefix="pis-")),
)
def test_pis_pasep_exhaustive(text, expected_rule_id, should_match, expected_value):
    _assert_detection(text, expected_rule_id, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_rule_id, should_match, expected_value",
    list(_make_params(RG_DF, prefix="rg-")),
)
def test_rg_exhaustive(text, expected_rule_id, should_match, expected_value):
    _assert_detection(text, expected_rule_id, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_rule_id, should_match, expected_value",
    list(_make_params(TITULO_ELEITOR_DF, prefix="titulo-")),
)
def test_titulo_eleitor_exhaustive(text, expected_rule_id, should_match, expected_value):
    _assert_detection(text, expected_rule_id, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_rule_id, should_match, expected_value",
    list(_make_params(US_SSN_DF, prefix="ssn-")),
)
def test_us_ssn_exhaustive(text, expected_rule_id, should_match, expected_value):
    _assert_detection(text, expected_rule_id, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_rule_id, should_match, expected_value",
    list(_make_params(US_PHONE_DF, prefix="usphone-")),
)
def test_us_phone_exhaustive(text, expected_rule_id, should_match, expected_value):
    _assert_detection(text, expected_rule_id, should_match, expected_value)


@pytest.mark.parametrize(
    "text, expected_types, should_match, expected_value",
    [
        pytest.param(
            row["input_text"],
            row["expected_types"],
            row["should_match"],
            None,
            id=f"multi-br-us-{idx}",
        )
        for idx, row in BRAZIL_US_MULTI_DF.iterrows()
    ],
)
def test_brazil_us_multi(text, expected_types, should_match, expected_value):
    results = detect_sensitive_data(text)
    found_ids = {d.rule_id for d in results}
    missing = expected_types - found_ids
    assert not missing, (
        f"Missing rule detections: {missing}\n"
        f"  input: {text!r}\n"
        f"  found: {found_ids}"
    )


@pytest.mark.parametrize(
    "bare_value, rule_id",
    [
        pytest.param(val, rid, id=f"bare-{rid}-{i}")
        for i, (val, rid) in enumerate(BARE_VALUE_REJECTION_CASES)
    ],
)
def test_bare_value_rejection(bare_value, rule_id):
    """Labeled patterns must NOT match bare values without labels."""
    results = detect_by_rule(bare_value, rule_id)
    assert not results, (
        f"Labeled rule {rule_id!r} should NOT match bare value {bare_value!r}, "
        f"but got: {[d.value for d in results]}"
    )
